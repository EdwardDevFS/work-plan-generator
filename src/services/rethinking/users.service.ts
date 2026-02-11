import { ApiResponse, CreateUserDto, UpdateUserDto, User } from "../../types/rethinking/organization.types";
import { delay } from "./mocks.example.service";

export let mockUsers: User[] = [];

export const usersService = {
  async getAll(tenantId: string): Promise<ApiResponse<User[]>> {
    await delay();
    return { data: mockUsers, success: true };
  },

  async create(data: CreateUserDto, tenantId: string): Promise<ApiResponse<User>> {
    await delay();
    const newUser: User = {
      id: `user-${Date.now()}`,
      tenantId,
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      idDepartment: data.idDepartment,
      idProvince: data.idProvince,
      idDistrict: data.idDistrict,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    return { data: newUser, success: true, message: 'Usuario creado' };
  },

  async update(id: string, data: UpdateUserDto): Promise<ApiResponse<User>> {
    await delay();
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Usuario no encontrado');
    mockUsers[index] = { ...mockUsers[index], ...data, updatedAt: new Date().toISOString() };
    return { data: mockUsers[index], success: true, message: 'Usuario actualizado' };
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    await delay();
    mockUsers = mockUsers.filter(u => u.id !== id);
    return { data: undefined, success: true, message: 'Usuario eliminado' };
  },
};