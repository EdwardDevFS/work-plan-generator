export interface Country {
  idCountry: number;
  name: string;
  nationality: string | null;
}

export interface Department {
  idDepartment: number;
  name: string;
  idCountry: number;
}

export interface Province {
  idProvince: number;
  name: string;
  idDepartment: number;
}

export interface District {
  idDistrict: number;
  name: string;
  idProvince: number;
}

export interface GetCountriesParams {
  search?: string;
}

export interface GetDepartmentsParams {
  search?: string;
  countryId?: number;
}

export interface GetProvincesParams {
  search?: string;
  departmentId?: number;
}

export interface GetDistrictsParams {
  search?: string;
  provinceId?: number;
}