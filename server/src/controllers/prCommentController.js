// server/src/controllers/prCommentController.js
const PRComment = require('../models/PRComment');
const PullRequest = require('../models/PullRequest');

exports.createPRComment = async (req, res) => {
  try {
    const { prId, comment } = req.body;
    // Check that the referenced PR exists
    const pr = await PullRequest.findByPk(prId);
    if (!pr) {
      return res.status(404).json({ error: "Pull Request not found" });
    }
    const prComment = await PRComment.create({
      prId,
      comment,
      authorId: req.user.id
    });
    res.json(prComment);
  } catch (error) {
    console.error("Error creating PR comment:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPRComments = async (req, res) => {
  try {
    const { prId } = req.params;
    const comments = await PRComment.findAll({
      where: { prId },
      include: [{ model: require('../models/User'), as: 'author', attributes: ['username'] }]
    });
    res.json(comments);
  } catch (error) {
    console.error("Error fetching PR comments:", error);
    res.status(500).json({ error: error.message });
  }
};
