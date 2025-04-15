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

    const bareRepoPath = path.join(REPO_BASE_PATH, `${pr.repository}.git`);
    console.log("Bare repo path:", bareRepoPath);

    // Create temporary directory
    const tempDir = path.join(os.tmpdir(), `pr-merge-${Date.now()}`);
    console.log("Creating temp directory:", tempDir);

    try {
      // Clone the repository
      console.log("Cloning repository...");
      const repo = await NodeGit.Clone(bareRepoPath, tempDir, {
        bare: 0,
        fetchOpts: {
          callbacks: {
            certificateCheck: () => 0
          }
        }
      });

      // Fetch all branches
      console.log("Fetching all branches...");
      await repo.fetchAll({
        callbacks: {
          certificateCheck: () => 0
        }
      });

      // Check if branches exist
      console.log("Checking branches existence and getting references...");
      const targetRef = await repo.getReference(`refs/remotes/origin/${pr.targetBranch}`)
        .catch(() => null);
      const sourceRef = await repo.getReference(`refs/remotes/origin/${pr.sourceBranch}`)
        .catch(() => null);

      if (!targetRef) {
        throw new Error(`Target branch '${pr.targetBranch}' not found`);
      }
      if (!sourceRef) {
        throw new Error(`Source branch '${pr.sourceBranch}' not found`);
      }

      // Get commits for both branches
      console.log("Getting commits for both branches...");
      const targetCommit = await repo.getReferenceCommit(targetRef);
      const sourceCommit = await repo.getReferenceCommit(sourceRef);
      
      console.log("Target commit:", targetCommit.id().toString());
      console.log("Source commit:", sourceCommit.id().toString());

      // Set up target branch
      console.log("Setting up target branch...");
      let localTargetBranch;
      try {
        localTargetBranch = await repo.getBranch(pr.targetBranch);
        console.log("Found existing target branch");
      } catch (e) {
        console.log("Creating new target branch");
        localTargetBranch = await repo.createBranch(pr.targetBranch, targetCommit, false);
      }

      // Force checkout target branch
      console.log("Checking out target branch:", pr.targetBranch);
      await repo.checkoutBranch(localTargetBranch, {
        checkoutStrategy: NodeGit.Checkout.STRATEGY.FORCE
      });

      // Set up source branch
      console.log("Setting up source branch...");
      let localSourceBranch;
      try {
        localSourceBranch = await repo.getBranch(pr.sourceBranch);
        console.log("Found existing source branch");
      } catch (e) {
        console.log("Creating new source branch");
        localSourceBranch = await repo.createBranch(pr.sourceBranch, sourceCommit, false);
      }

      // Try to merge
      try {
        console.log("Attempting merge...");
      
        // First try analyze merge
        const annotatedCommit = await NodeGit.AnnotatedCommit.fromRef(repo, sourceRef);
        const result = await NodeGit.Merge.analysis(repo, [annotatedCommit]);
        console.log("Merge analysis result:", result);

        // Check if merge is possible
        if (result & NodeGit.Merge.ANALYSIS.NORMAL) {
          console.log("Normal merge is possible");
          
          // Perform merge
          await NodeGit.Merge.merge(repo, annotatedCommit, null, {
            fileFavor: NodeGit.Merge.FILE_FAVOR.NORMAL,
            mergeFlags: NodeGit.Merge.FLAG.NONE,
            checkoutStrategy: NodeGit.Checkout.STRATEGY.FORCE
          });

          // Get and analyze index
          const index = await repo.index();
          console.log("Index has conflicts:", index.hasConflicts());

          if (index.hasConflicts()) {
            console.log("Merge conflicts detected");
            const conflicts = await getConflictInfo(repo, pr.sourceBranch, pr.targetBranch);
            throw { status: 409, conflicts };
          }

          // Write index
          await index.write();
          console.log("Index written");

          // Create tree
          const treeOid = await index.writeTree();
          console.log("Tree created:", treeOid.toString());

          // Create merge commit
          console.log("Creating merge commit...");
          const sig = repo.defaultSignature();
          const commitOid = await repo.createCommit(
            "HEAD",
            sig,
            sig,
            `Merge PR #${pr.id} from ${pr.sourceBranch} into ${pr.targetBranch}`,
            treeOid,
            [targetCommit, sourceCommit]
          );
          console.log("Merge commit created:", commitOid.toString());

          // Push changes
          console.log("Pushing changes...");
          const remote = await repo.getRemote("origin");
          await remote.push([`refs/heads/${pr.targetBranch}:refs/heads/${pr.targetBranch}`], {
            callbacks: {
              certificateCheck: () => 0
            }
          });

          // Update PR status
          pr.status = "merged";
          await pr.save();
          console.log("PR marked as merged");

          res.json({ status: 'merged', message: "PR merged successfully" });
        } else if (result & NodeGit.Merge.ANALYSIS.FASTFORWARD) {
          console.log("Fast-forward merge is possible");
          // Handle fast-forward merge
          const newOid = sourceCommit.id();
          await targetRef.setTarget(newOid, "Fast-forward merge");
          await repo.checkoutBranch(targetRef);
          
          // Push changes
          const remote = await repo.getRemote("origin");
          await remote.push([`refs/heads/${pr.targetBranch}:refs/heads/${pr.targetBranch}`], {
            callbacks: {
              certificateCheck: () => 0
            }
          });

          pr.status = "merged";
          await pr.save();
          res.json({ status: 'merged', message: "Fast-forward merge successful" });
        } else {
          throw new Error("Merge analysis indicates merge is not possible");
        }
      } catch (mergeError) {
        console.error("Merge error:", mergeError);
        if (mergeError.status === 409) {
          res.status(409).json({ 
            error: "Merge conflicts detected", 
            conflicts: mergeError.conflicts 
          });
        } else {
          throw mergeError;
        }
      }
    } finally {
      // Clean up temp directory
      console.log("Cleaning up temp directory");
      await fs.remove(tempDir);
    }

    console.log("=== MERGE PR END ===\n");
  } catch (error) {
    console.error("Error during merge process:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ 
      error: error.message || "Error during merge process",
      details: error.stack
    });
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
        content: `
 ${targetBranch}
${ourBlob.toString()}
${theirBlob.toString()} ${sourceBranch}
`
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