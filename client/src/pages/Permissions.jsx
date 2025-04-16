// import React, { useEffect, useState } from "react";
// import api from "../utils/api";

// function Permissions() {
//   const [permissions, setPermissions] = useState({});
//   const [sshKey, setSshKey] = useState("");
//   const [repo, setRepo] = useState("");
//   const [newPermissions, setNewPermissions] = useState("");
//   const [message, setMessage] = useState("");

//   const predefinedPermissions = ["clone", "push"];
//   // Fetch all permissions
//   const fetchPermissions = async () => {
//     try {
//       const { data } = await api.get("/permissions/all");
//       setPermissions(data);
//     } catch (err) {
//       console.error("Error fetching permissions:", err);
//     }
//   };

//   // Update permissions for a specific SSH key
//   const handleUpdate = async () => {
//     try {
//       await api.post("/permissions/update", {
//         sshKey,
//         repo,
//         permissions: newPermissions.split(",").map(p => p.trim())
//       });
//       setMessage("Permissions updated successfully");
//       fetchPermissions();
//     } catch (err) {
//       console.error("Error updating permissions:", err);
//       setMessage("Error updating permissions");
//     }
//   };

//   useEffect(() => {
//     fetchPermissions();
//   }, []);

//   return (
//     <div style={{ padding: "2rem" }}>
//       <h2>Manage Permissions</h2>
//       {message && <p>{message}</p>}
//       <table border="1" cellPadding="8">
//         <thead>
//           <tr>
//             <th>SSH Key</th>
//             <th>Repository</th>
//             <th>Permissions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {Object.entries(permissions).map(([key, repos]) =>
//             Object.entries(repos).map(([repoName, perms]) => (
//               <tr key={`${key}-${repoName}`}>
//                 <td>{key}</td>
//                 <td>{repoName}</td>
//                 <td>{perms.join(", ")}</td>
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>
//       <h3>Update Permissions</h3>
//       <input
//         type="text"
//         placeholder="SSH Key"
//         value={sshKey}
//         onChange={(e) => setSshKey(e.target.value)}
//       />
//       <input
//         type="text"
//         placeholder="Repository"
//         value={repo}
//         onChange={(e) => setRepo(e.target.value)}
//       />
//       <div>
//         <h4>Select Permissions:</h4>
//         {predefinedPermissions.map((permission) => (
//           <label key={permission} style={{ marginRight: "1rem" }}>
//             <input
//               type="checkbox"
//               checked={selectedPermissions.includes(permission)}
//               onChange={() => togglePermission(permission)}
//             />
//             {permission}
//           </label>
//         ))}
//       </div>
//       <button onClick={handleUpdate}>Update</button>
//     </div>
//   );
// }

// export default Permissions;


import React, { useEffect, useState } from "react";
import api from "../utils/api";

function Permissions() {
  const [permissions, setPermissions] = useState({});
  const [sshKey, setSshKey] = useState("");
  const [repo, setRepo] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]); // Define selectedPermissions
  const [message, setMessage] = useState("");
  const [branch, setBranch] = useState(""); // Add this line

  const predefinedPermissions = ["R", "W", "RW+", "branch"];

  // Fetch all permissions
  const fetchPermissions = async () => {
    try {
      const { data } = await api.get("/permissions/all");
      console.log("Getched permissions: = ", data);
      setPermissions(data);
    } catch (err) {
      console.error("Error fetching permissions:", err);
    }
  };

  // Update permissions for a specific SSH key
  // const handleUpdate = async () => {
  //   try {
  //     await api.post("/permissions/update", {
  //       sshKey,
  //       repo,
  //       permissions: selectedPermissions, // Use selectedPermissions
  //     });
  //     setMessage("Permissions updated successfully");
  //     fetchPermissions();
  //   } catch (err) {
  //     console.error("Error updating permissions:", err);
  //     setMessage("Error updating permissions");
  //   }
  // };
  const handleUpdate = async () => {
    try {
      console.log("Updating permissions with:", {
        sshKey,
        repo,
        permissions: selectedPermissions,
        branch,
      });
      await api.post("/permissions/update", {
        sshKey,
        repo,
        permissions: selectedPermissions,
        branch,
      });
      setMessage("Permissions updated successfully");
      fetchPermissions();
    } catch (err) {
      console.error("Error updating permissions:", err);
      setMessage("Error updating permissions");
    }
  };

  // Toggle permission selection
  const togglePermission = (permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Manage Permissions</h2>
      {message && <p>{message}</p>}
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>SSH Key</th>
            <th>Repository</th>
            <th>Permissions</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(permissions || {}).map(([key, repos]) =>
            Object.entries(repos || {}).map(([repoName, repoData]) => (
              <tr key={`${key}-${repoName}`}>
                <td>{key}</td>
                <td>{repoName}</td>
                <td>
                  {(repoData.permissions || []).join(", ")}{" "}
                  {repoData.branch ? `(Branch: ${repoData.branch})` : ""}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <h3>Update Permissions</h3>
      <input
        type="text"
        placeholder="SSH Key"
        value={sshKey}
        onChange={(e) => setSshKey(e.target.value)}
      />
      <input
        type="text"
        placeholder="Repository"
        value={repo}
        onChange={(e) => setRepo(e.target.value)}
      />
      <div>
        <h4>Select Permissions:</h4>
        {predefinedPermissions.map((permission) => (
          <label key={permission} style={{ marginRight: "1rem" }}>
            <input
              type="checkbox"
              checked={selectedPermissions.includes(permission)}
              onChange={() => togglePermission(permission)}
            />
            {permission}
          </label>
        ))}
      </div>
      {selectedPermissions.includes("branch") && (
        <input
          type="text"
          placeholder="Branch Name"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
        />
      )}
      <button onClick={handleUpdate}>Update</button>
    </div>
  );
}

export default Permissions;