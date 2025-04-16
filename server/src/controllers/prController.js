// server/src/controlleer.js
const NodeGit = require("nodegit");
const path = require("path");
const os = require("os");
const fs = require("fs-extra"); // Using fs-extra for convenient directory removal      
const { exec } = require("child_process");
const PullRequest = require("../models/PullRequest");
const util = require("util");


// Base directory where your bare repositories are stored
const REPO_BASE_PATH = "/home/git/repositories";

// Helper: Wrap exec in a Promise
function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        // Return stdout/stderr even if the command "failed"
        error.stdout = stdout;
        error.stderr = stderr;
        return reject(error);
      }
      resolve(stdout);
    });
  });
}

/**
 * Create a new Pull Request.
 * Expects a request body with: repository, sourceBranch, targetBranch, title, description.
 */
const createPR = async (req, res) => {
  try {
    const { repository, sourceBranch, targetBranch, title, description } = req.body;    
    const pr = await PullRequest.create({
      repository,
      sourceBranch,
      targetBranch,
      title,
      description,
      creatorId: req.user.id,
    });
    res.json(pr);
  } catch (error) {
    console.error("Error creating PR:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * List all Pull Requests.
 */
const listPRs = async (req, res) => {
  try {
    const prs = await PullRequest.findAll();
    res.json(prs);
  } catch (error) {
    console.error("Error listing PRs:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get details of a specific Pull Request.
 */
const getPR = async (req, res) => {
  try {
    const pr = await PullRequest.findByPk(req.params.id);
    if (!pr) {
      return res.status(404).json({ error: "Pull Request not found" });
    }
    res.json(pr);
  } catch (error) {
    console.error("Error fetching PR:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Approve a Pull Request.
 * This marks the PR as "approved" in the database.
 */
const approvePR = async (req, res) => {
  try {
    const pr = await PullRequest.findByPk(req.params.id);
    if (!pr) {
      return res.status(404).json({ error: "Pull Request not found" });
    }
    pr.status = "approved";
    await pr.save();
    res.json(pr);
  } catch (error) {
    console.error("Error approving PR:", error);
    res.status(500).json({ error: error.message });
  }
};


const mergePR__ = async (req, res) => {
  let tempDir = null;
  try {
    console.log("mergePR: Starting merge for PR id:", req.params.id);
    const pr = await PullRequest.findByPk(req.params.id);
    if (!pr) {
      console.error("mergePR: PR not found");
      return res.status(404).json({ error: "Pull Request not found" });
    }
    if (pr.status !== "approved") {
      console.error("mergePR: PR not approved");
      return res.status(400).json({ error: "PR must be approved before merging" });     
    }

    const bareRepoPath = "file://" + path.join(REPO_BASE_PATH, pr.repository) + ".git";
    tempDir = path.join(os.tmpdir(), `repo-merge-temp-${Date.now()}`);
    console.log("mergePR: Creating temporary directory:", tempDir);

    // Clone the repository
    const repo = await NodeGit.Clone(bareRepoPath, tempDir, {
      bare: 0,
      checkoutBranch: pr.targetBranch,
      fetchOpts: { callbacks: { certificateCheck: () => 0 } }
    });
    console.log("mergePR: Repository cloned");

    // Fetch all branches
    await repo.fetchAll({ callbacks: { certificateCheck: () => 0 } });
    console.log("mergePR: All branches fetched");

    // Get source and target refs
    const sourceRef = await repo.getReference(`refs/remotes/origin/${pr.sourceBranch}`);
    const targetRef = await repo.getReference(`refs/remotes/origin/${pr.targetBranch}`);
    
    if (!sourceRef || !targetRef) {
      throw new Error("Could not find source or target branch");
    }

    // Get commits for both branches
    const sourceCommit = await repo.getReferenceCommit(sourceRef);
    const targetCommit = await repo.getReferenceCommit(targetRef);
    console.log("mergePR: Got both commits");

    // Create annotated commit for merge analysis
    const annotatedCommit = await NodeGit.AnnotatedCommit.fromRef(repo, sourceRef);
    console.log("mergePR: Created annotated commit");
    
    try {
      // Perform merge analysis
      console.log("mergePR: Analyzing merge possibility...");
      const analysis = await NodeGit.Merge.analysis(repo, [annotatedCommit]);
      
      if (analysis & NodeGit.Merge.ANALYSIS.NORMAL) {
        console.log("mergePR: Normal merge is possible");
        
        // Try the merge
        await NodeGit.Merge.commit(repo, annotatedCommit, null, {
          checkoutStrategy: NodeGit.Checkout.STRATEGY.FORCE,
          fileFavor: NodeGit.Merge.FILE_FAVOR.NORMAL
        });

        // Check for conflicts
        const index = await repo.index();
        
        if (index.hasConflicts()) {
          console.log("mergePR: Merge conflicts detected");
          const conflicts = [];
          
          // Get conflict entries
          const entries = index.entries();
          for (const entry of entries) {
            if (entry.isConflicted()) {
              try {
                const ours = await entry.getOurs();
                const theirs = await entry.getTheirs();
                
                if (ours && theirs) {
                  const oursBlob = await repo.getBlob(ours.id());
                  const theirsBlob = await repo.getBlob(theirs.id());
                  
                  conflicts.push({
                    file: entry.path,
                    content: `<<<<<<< ${pr.targetBranch}\n${oursBlob.toString()}\n=======\n${theirsBlob.toString()}\n>>>>>>> ${pr.sourceBranch}`
                  });
                }
              } catch (err) {
                console.error("Error getting conflict details:", err);
              }
            }
          }

          return res.status(409).json({
            error: "Merge conflicts detected",
            conflicts,
            pr: {
              id: pr.id,
              sourceBranch: pr.sourceBranch,
              targetBranch: pr.targetBranch
            }
          });
        }

        // No conflicts, create merge commit
        console.log("mergePR: No conflicts, creating merge commit");
        index = await repo.index();
        await index.write();
        const treeOid = await index.writeTree();
        
        const signature = repo.defaultSignature();
        const commitOid = await repo.createCommit(
          "HEAD",
          signature,
          signature,
          `Merge branch '${pr.sourceBranch}' into ${pr.targetBranch}`,
          treeOid,
          [targetCommit, sourceCommit]
        );
        console.log("mergePR: Merge commit created:", commitOid.toString());

      } else if (analysis & NodeGit.Merge.ANALYSIS.FASTFORWARD) {
        console.log("mergePR: Fast-forward merge is possible");
        // Perform fast-forward
        await targetRef.setTarget(sourceCommit, "Fast-forward merge");
        await repo.checkoutBranch(targetRef);
        
      } else if (analysis & NodeGit.Merge.ANALYSIS.UP_TO_DATE) {
        console.log("mergePR: Branches are already up-to-date");
        return res.json({ 
          status: "success", 
          message: "Branches are already up-to-date" 
        });
      } else {
        throw new Error("Merge analysis indicates merge is not possible");
      }

      // Push changes
      console.log("mergePR: Pushing changes...");
      const remote = await repo.getRemote("origin");
      await remote.push(
        [`refs/heads/${pr.targetBranch}:refs/heads/${pr.targetBranch}`],
        { callbacks: { certificateCheck: () => 0 } }
      );

      // Update PR status
      console.log("mergePR: Updating PR status...");
      pr.status = "merged";
      await pr.save();

      res.json({ 
        status: "merged", 
        message: "PR merged successfully",
        pr 
      });

    } catch (mergeError) {
      console.error("mergePR: Merge operation failed:", mergeError);
      throw mergeError;
    }

  } catch (error) {
    console.error("mergePR: Error during merge process:", error);
    res.status(500).json({ error: error.message });
  } finally {
    // Clean up temp directory
    if (tempDir) {
      try {
        await fs.remove(tempDir);
        console.log("mergePR: Temporary directory cleaned up");
      } catch (err) {
        console.error("mergePR: Error cleaning up:", err);
      }
    }
  }
};

/**
 * Merge an approved Pull Request.
 * This function clones the bare repository into a temporary working directory,
 * checks out both target and source branches, and then uses mergeBranches to merge them.
 * After the merge, it pushes the updated branch back to the bare repository and cleans up.
 */
const mergePR = async (req, res) => {
  try {
    console.log("\n=== MERGE PR START ===");
    console.log("PR ID:", req.params.id);
    
    // Get PR details
    const pr = await PullRequest.findByPk(req.params.id);
    if (!pr) {
      console.error("PR not found");
      return res.status(404).json({ error: "Pull Request not found" });
    }

    console.log("PR Details:", {
      repository: pr.repository,
      sourceBranch: pr.sourceBranch,
      targetBranch: pr.targetBranch,
      status: pr.status
    });

    // Check approval status
    if (pr.status !== "approved") {
      console.error("PR not approved");
      return res.status(400).json({ error: "PR must be approved before merging" });
    }

    // Check user permissions
    const permissionsFile = "/var/lib/git/permissions.json";
    const userPermissions = JSON.parse(fs.readFileSync(permissionsFile, "utf8"));
    const userKeyHash = req.user.keyHash;

    if (!userPermissions[userKeyHash]?.[pr.repository]?.permissions?.includes("RW+")) {
      return res.status(403).json({ error: "You don't have permission to merge this PR" });
    }
    mergePR__(req, res);
  }
  finally{
    console.log(-11);
  }
};

// Helper function to get conflict information
async function getConflictInfo(repo, sourceBranch, targetBranch) {
  const conflicts = [];
  
  try {
    const index = await repo.index();
    const conflictedPaths = index.entries().filter(entry => entry.isConflicted());

    for (const entry of conflictedPaths) {
      const ancestorBlob = await repo.getBlob(entry.ancestorId());
      const ourBlob = await repo.getBlob(entry.ourId());
      const theirBlob = await repo.getBlob(entry.theirId());

      conflicts.push({
        file: entry.path(),
        content: `<<<<<<< ${targetBranch}
${ourBlob.toString()}
=======
${theirBlob.toString()}
>>>>>>> ${sourceBranch}`,
      });
    }
  } catch (error) {
    console.error("Error getting conflict info:", error);
  }

  return conflicts;
}

const runStaticAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const pr = await PullRequest.findByPk(id);

    if (!pr) {
      return res.status(404).json({ error: "Pull Request not found" });
    }

    // Use the bare repository path and clone it into a temporary working directory.    
    const bareRepoPath = path.join(REPO_BASE_PATH, `${pr.repository}.git`);
    const tempDir = path.join(os.tmpdir(), `static-analysis-${Date.now()}`);
    console.log("Cloning for static analysis from", bareRepoPath, "to", tempDir);       

    // Clone the repository using the target branch (or main branch if targetBranch is not specified)
    const cloneOptions = {
      bare: 0,
      checkoutBranch: pr.targetBranch || "master",
      fetchOpts: {
        callbacks: {
          certificateCheck: () => 0,
        },
      },
    };
    const repo = await NodeGit.Clone(bareRepoPath, tempDir, cloneOptions);
    console.log("Clone completed. Analyzing all files in", tempDir);

    // Log the contents of the temporary directory for debugging
    const files = fs.readdirSync(tempDir);
    console.log("Files in temporary directory:", files);

    // Run static analysis tools
    let banditResult = "";
    let flake8Result = "";
    let cppcheckResult = "";

    // Check if Python files exist
    const pythonFilesExist = fs.readdirSync(tempDir).some((file) => file.endsWith(".py"));
    if (pythonFilesExist) {
      try {
        banditResult = await execPromise(`bandit -r ${tempDir}`);
      } catch (e) {
        // Bandit returns exit code 1 if issues are found (treat as success)
        banditResult = e.stdout || e.message;
      }
      try {
        flake8Result = await execPromise(`flake8 ${tempDir}`);
      } catch (e) {
        // Flake8 returns exit code 1 if issues are found (treat as success)
        flake8Result = e.stdout || e.message;
      }
    } else {
      banditResult = "No Python files found for analysis.";
      flake8Result = "No Python files found for analysis.";
    }

    // Check if C/C++ files exist
    const cppFilesExist = fs.readdirSync(tempDir).some((file) => file.endsWith(".cpp") || file.endsWith(".c"));
    if (cppFilesExist) {
      try {
        // Remove "--quiet" to see Cppcheck output even if no issues are found
        try {
  const { stdout, stderr } = await execPromise(`cppcheck --enable=all ${tempDir}`);     
  cppcheckResult = `${stdout || ""}${stderr || ""}`.trim();
 // Capture both standard output and errors
} catch (e) {
  cppcheckResult = e.stdout || e.stderr || e.message; // Ensure full error logging      
}

      } catch (e) {
        cppcheckResult = e.stdout || e.message;
      }
    } else {
      cppcheckResult = "No C/C++ files found for analysis.";
    }

    // Clean up the temporary directory
    await fs.remove(tempDir);
    console.log("Temporary directory cleaned up.");

    // Return results
    const analysisResults = {
      reports: [
        { tool: "Bandit", result: banditResult.trim() || "No issues found." },
        { tool: "Flake8", result: flake8Result.trim() || "No issues found." },
        { tool: "Cppcheck", result: cppcheckResult.trim() || "No issues found." },      
      ],
    };
    console.log("Sending analysis results to frontend:", analysisResults);
    res.json(analysisResults);
  } catch (error) {
    console.error("Error running static analysis:", error);
    res.status(500).json({ error: "Static analysis failed" });
  }
};





module.exports = {
    createPR,
    listPRs,
    getPR,
    approvePR,
    mergePR,
    runStaticAnalysis,
};