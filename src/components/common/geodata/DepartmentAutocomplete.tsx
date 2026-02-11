import React, { useState, useEffect } from 'react';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import { geodataService } from '../../../services/rethinking/geodata.service';
import { Department } from '../../../types/rethinking/geodata.types';

interface DepartmentAutocompleteProps {
  value: Department | null;
  onChange: (value: Department | null) => void;
  countryId?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const DepartmentAutocomplete: React.FC<DepartmentAutocompleteProps> = ({
  value,
  onChange,
  countryId,
  placeholder = 'Seleccionar departamento',
  className = '',
  disabled = false,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (countryId) {
      loadDepartments();
    } else {
      setDepartments([]);
      setFilteredDepartments([]);
      onChange(null);
    }
  }, [countryId]);

  const loadDepartments = async (search?: string) => {
    setLoading(true);
    try {
      const data = await geodataService.getDepartments({ search, countryId });
      setDepartments(data);
      setFilteredDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchDepartments = (event: AutoCompleteCompleteEvent) => {
    loadDepartments(event.query);
  };

  return (
    <div className={`w-full ${className}`}>
      <AutoComplete
        value={value}
        suggestions={filteredDepartments}
        completeMethod={searchDepartments}
        field="name"
        onChange={(e) => onChange(e.value)}
        placeholder={placeholder}
        className="w-full"
        inputClassName="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        panelClassName="bg-white shadow-lg rounded-lg mt-1"
        disabled={disabled || !countryId}
        dropdown
        forceSelection
      />
    </div>
  );
};