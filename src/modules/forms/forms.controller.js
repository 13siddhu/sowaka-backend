const prisma = require('../../config/db');

const createForm = async (req, res, next) => {
  try {
    const { campaignId, title, questions } = req.body;
    
    // Create form with nested questions and options
    const form = await prisma.form.create({
      data: {
        campaignId,
        title,
        questions: {
          create: questions.map(q => ({
            text: q.text,
            type: q.type,
            isRequired: q.isRequired,
            orderIndex: q.orderIndex,
            options: q.options ? {
              create: q.options.map(o => ({
                text: o.text,
                orderIndex: o.orderIndex
              }))
            } : undefined
          }))
        }
      },
      include: { questions: { include: { options: true } } }
    });
    
    res.json({ success: true, data: form });
  } catch (error) {
    next(error);
  }
};

const getFormByCampaign = async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const form = await prisma.form.findUnique({
      where: { campaignId },
      include: { questions: { include: { options: true }, orderBy: { orderIndex: 'asc' } } }
    });
    res.json({ success: true, data: form });
  } catch (error) {
    next(error);
  }
};

const addQuestion = async (req, res, next) => {
  try {
    const { formId } = req.params;
    const { text, type, isRequired, orderIndex, options } = req.body;
    
    const question = await prisma.question.create({
      data: {
        formId, text, type, isRequired, orderIndex,
        options: options ? { create: options } : undefined
      },
      include: { options: true }
    });
    
    res.json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { text, isRequired, orderIndex } = req.body;
    
    const question = await prisma.question.update({
      where: { id: questionId },
      data: { text, isRequired, orderIndex }
    });
    
    res.json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    await prisma.question.delete({ where: { id: questionId } });
    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createForm, getFormByCampaign, addQuestion, updateQuestion, deleteQuestion };
