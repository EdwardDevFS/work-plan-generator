import { ApiResponse, Headquarters } from "../../types/rethinking/organization.types";
import { delay } from "./mocks.example.service";
import { mockHeadquarters } from "./zonals.service";

export const headquartersService = {
  async getByZonal(zonalId: string): Promise<ApiResponse<Headquarters[]>> {
    await delay();
    const items = mockHeadquarters.filter(hq => hq.zonalId === zonalId);
    return { data: items, success: true };
  },
};
