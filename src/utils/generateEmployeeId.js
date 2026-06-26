import { Employee } from "../models/employee.model.js";

export const generateUniqueEmployeeId = async () => {
  let employeeId;
  let existingEmployee = true;

  while (existingEmployee) {
    const year = new Date().getFullYear();
    const randomNumber = Math.floor(1000 + Math.random() * 9000);

    employeeId = `HRM-${year}-${randomNumber}`;
    existingEmployee = await Employee.exists({ employeeId });
  }

  return employeeId;

};

