const { Code, User } = require('../models');

exports.createCode = async (req, res) => {
  try {
    const { title, code } = req.body;
    const newCode = await Code.create({ title, code, authorId: req.user.id });
    res.json(newCode);
  } catch (error) {
    console.error("Error creating code:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCodes = async (req, res) => {
  try {
    const codes = await Code.findAll({
      include: [{ model: User, as: 'author', attributes: ['username'] }]
    });
    res.json(codes);
  } catch (error) {
    console.error("Error fetching codes:", error);
    res.status(500).json({ message: error.message });
  }
};
