const bcrypt = require('bcrypt');
const prisma = require('../../config/db');

const listEmployees = async (req, res, next) => {
  try {
    const { page = 1, limit = 100, search, departmentId, status, role } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(role && { role }),
      ...(status && { status }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
      ...(departmentId && { departmentId })
    };

    // If HR_ADMIN, usually they only manage employees
    if (req.user.role === 'HR_ADMIN' && !role) {
      where.role = 'EMPLOYEE';
    }

    const employees = await prisma.user.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      select: { id: true, employeeId: true, name: true, email: true, departmentId: true, status: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where });

    res.json({ success: true, data: employees, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    next(error);
  }
};

const addEmployee = async (req, res, next) => {
  try {
    const { employeeId, name, email, password, departmentId, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await prisma.user.create({
      data: { employeeId, name, email, password: hashedPassword, departmentId, role: role || 'EMPLOYEE' }
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'ADD_EMPLOYEE', metadata: { newEmployeeId: employee.id } }
    });

    res.json({ success: true, data: { id: employee.id, name: employee.name } });
  } catch (error) {
    next(error);
  }
};

const editEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, departmentId, role } = req.body;

    const employee = await prisma.user.update({
      where: { id },
      data: { name, departmentId, role }
    });

    res.json({ success: true, data: { id: employee.id, name: employee.name } });
  } catch (error) {
    next(error);
  }
};

const changeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Role-based approval logic
    if (req.user.role === 'HR_ADMIN') {
      if (targetUser.role !== 'EMPLOYEE') {
        return res.status(403).json({ success: false, message: 'HR can only approve Employees' });
      }
    } else if (req.user.role === 'SUPER_ADMIN') {
      // Super admin can approve both HR and Employees
    } else {
      return res.status(403).json({ success: false, message: 'Unauthorized to change status' });
    }

    await prisma.user.update({
      where: { id },
      data: { status }
    });

    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (error) {
    next(error);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'Employee deleted' });
  } catch (error) {
    next(error);
  }
};

const bulkImport = async (req, res, next) => {
  try {
    const { employees } = req.body; // Expecting array of employee objects
    
    // In production, you'd parse a CSV file. For now, assuming JSON array.
    let count = 0;
    for (const emp of employees) {
      const hashedPassword = await bcrypt.hash(emp.password || 'defaultPassword123', 10);
      await prisma.user.create({
        data: {
          employeeId: emp.employeeId,
          name: emp.name,
          email: emp.email,
          password: hashedPassword,
          departmentId: emp.departmentId
        }
      });
      count++;
    }

    res.json({ success: true, message: `Imported ${count} employees` });
  } catch (error) {
    next(error);
  }
};

module.exports = { listEmployees, addEmployee, editEmployee, changeStatus, deleteEmployee, bulkImport };
