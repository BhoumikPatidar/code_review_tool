#!/bin/bash

# git-auth-wrapper.sh - Authentication wrapper for Git SSH access
# This script enforces repository permissions for Git operations over SSH

# Get the username from the first argument
USERNAME="$1"

# Log access attempts for debugging
LOG_FILE="/var/log/git-access.log"
echo "$(date): Access attempt by $USERNAME: $SSH_ORIGINAL_COMMAND" >> $LOG_FILE

# Exit if no original command
if [ -z "$SSH_ORIGINAL_COMMAND" ]; then
    echo "Interactive shell access is not allowed."
    exit 1
fi

# Parse the Git command to determine repository and operation type
# Expected format: git-upload-pack '/path/to/repo.git' or git-receive-pack '/path/to/repo.git'
CMD=$(echo "$SSH_ORIGINAL_COMMAND" | cut -d' ' -f1)
REPO_PATH=$(echo "$SSH_ORIGINAL_COMMAND" | cut -d' ' -f2 | tr -d "'")
REPO_NAME=$(basename "$REPO_PATH")

# Log the parsed information
echo "Command: $CMD, Repository: $REPO_NAME" >> $LOG_FILE

# Check permission using the Node.js helper script
# This script queries the database and returns allowed operations
PERMISSION_RESULT=$(node /path/to/check-git-permission.js "$USERNAME" "$REPO_NAME")
EXIT_CODE=$?

# Log the permission check result
echo "Permission check result: $PERMISSION_RESULT (exit code: $EXIT_CODE)" >> $LOG_FILE

# If permission check failed, deny access
if [ $EXIT_CODE -ne 0 ]; then
    echo "Permission check failed: $PERMISSION_RESULT"
    exit 1
fi

# Check if the operation is allowed based on permission level
if [[ "$CMD" == "git-upload-pack" ]]; then
    # Read operation - requires READER or higher
    if [[ "$PERMISSION_RESULT" != *"read"* ]]; then
        echo "You don't have permission to read from this repository."
        exit 1
    fi
elif [[ "$CMD" == "git-receive-pack" ]]; then
    # Write operation - requires CONTRIBUTOR or higher
    if [[ "$PERMISSION_RESULT" != *"write"* ]]; then
        echo "You don't have permission to write to this repository."
        exit 1
    fi
fi

# If we made it here, the operation is authorized
# Execute the original command
exec $SSH_ORIGINAL_COMMAND