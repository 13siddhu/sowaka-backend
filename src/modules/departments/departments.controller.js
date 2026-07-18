const prisma = require('../../config/db');

const listDepartments = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      include: { _count: { select: { users: true, teams: true } } }
    });
    res.json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const dept = await prisma.department.create({ data: { name, description } });
    res.json({ success: true, data: dept });
  } catch (error) {
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const dept = await prisma.department.update({
      where: { id },
      data: { name, description }
    });
    res.json({ success: true, data: dept });
  } catch (error) {
    next(error);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.department.delete({ where: { id } });
    res.json({ success: true, message: 'Department deleted' });
  } catch (error) {
    next(error);
  }
};

const createTeam = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { name, description } = req.body;
    const team = await prisma.team.create({
      data: { name, description, departmentId }
    });
    res.json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

const listTeams = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const teams = await prisma.team.findMany({ where: { departmentId } });
    res.json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
};

module.exports = { listDepartments, createDepartment, updateDepartment, deleteDepartment, createTeam, listTeams };
