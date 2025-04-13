// src/pages/SshKeyUpdate.jsx
import React, { useState } from "react";
import api from "../utils/api";
import { TextField } from "@mui/material";

function SshKeyUpdate() {
  const [publicKey, setPublicKey] = useState("");
  const [message, setMessage] = useState("");

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/user/sshkey", { publicKey });
      setMessage(data.message);
    } catch (error) {
      console.error("Error updating SSH key:", error);
      setMessage(error.response?.data?.error || "Error updating SSH key");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Update Your SSH Public Key</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleUpdate}>
        <TextField
          multiline
          label="Paste your SSH public key here"
          value={publicKey}
          onChange={(e) => setPublicKey(e.target.value)}
          rows="4"
          required
          style={{ width: "25%" }}
        />
        <br />
        <br />
        <button type="submit">Update SSH Key</button>
      </form>
    </div>
  );
}

export default SshKeyUpdate;
