const { Comment, User } = require('../models');

exports.createComment = async (req, res) => {
  try {
    const { codeId, comment } = req.body;
    const newComment = await Comment.create({ codeId, comment, authorId: req.user.id });
    res.json(newComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCommentsByCode = async (req, res) => {
  try {
    const { codeId } = req.params;
    const comments = await Comment.findAll({
      where: { codeId },
      include: [{ model: User, as: 'author', attributes: ['username'] }]
    });
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: error.message });
  }
};
