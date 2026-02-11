import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { CountryAutocomplete } from './CountryAutocomplete';
import { DepartmentAutocomplete } from './DepartmentAutocomplete';
import { ProvinceAutocomplete } from './ProvinceAutocomplete';
import { DistrictAutocomplete } from './DistrictAutocomplete';
import { Country, Department, Province, District } from '../../../types/rethinking/geodata.types';

export const GeodataForm: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);

  const handleCountryChange = (country: Country | null) => {
    setSelectedCountry(country);
    setSelectedDepartment(null);
    setSelectedProvince(null);
    setSelectedDistrict(null);
  };

  const handleDepartmentChange = (department: Department | null) => {
    setSelectedDepartment(department);
    setSelectedProvince(null);
    setSelectedDistrict(null);
  };

  const handleProvinceChange = (province: Province | null) => {
    setSelectedProvince(province);
    setSelectedDistrict(null);
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8 p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Selección de Ubicación</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            País
          </label>
          <CountryAutocomplete
            value={selectedCountry}
            onChange={handleCountryChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Departamento
          </label>
          <DepartmentAutocomplete
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            countryId={selectedCountry?.idCountry}
            disabled={!selectedCountry}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provincia
          </label>
          <ProvinceAutocomplete
            value={selectedProvince}
            onChange={handleProvinceChange}
            departmentId={selectedDepartment?.idDepartment}
            disabled={!selectedDepartment}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distrito
          </label>
          <DistrictAutocomplete
            value={selectedDistrict}
            onChange={setSelectedDistrict}
            provinceId={selectedProvince?.idProvince}
            disabled={!selectedProvince}
          />
        </div>

        {selectedDistrict && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Ubicación Seleccionada:</h3>
            <p className="text-sm text-blue-800">
              {selectedCountry?.name} → {selectedDepartment?.name} → {selectedProvince?.name} → {selectedDistrict?.name}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};