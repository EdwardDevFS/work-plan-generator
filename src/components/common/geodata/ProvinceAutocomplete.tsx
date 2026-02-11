import React, { useState, useEffect } from 'react';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import { geodataService } from '../../../services/rethinking/geodata.service';
import { Province } from '../../../types/rethinking/geodata.types';

interface ProvinceAutocompleteProps {
  value: Province | null;
  onChange: (value: Province | null) => void;
  departmentId?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const ProvinceAutocomplete: React.FC<ProvinceAutocompleteProps> = ({
  value,
  onChange,
  departmentId,
  placeholder = 'Seleccionar provincia',
  className = '',
  disabled = false,
}) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [filteredProvinces, setFilteredProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (departmentId) {
      loadProvinces();
    } else {
      setProvinces([]);
      setFilteredProvinces([]);
      onChange(null);
    }
  }, [departmentId]);

  const loadProvinces = async (search?: string) => {
    setLoading(true);
    try {
      const data = await geodataService.getProvinces({ search, departmentId });
      setProvinces(data);
      setFilteredProvinces(data);
    } catch (error) {
      console.error('Error loading provinces:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchProvinces = (event: AutoCompleteCompleteEvent) => {
    loadProvinces(event.query);
  };

  return (
    <div className={`w-full ${className}`}>
      <AutoComplete
        value={value}
        suggestions={filteredProvinces}
        completeMethod={searchProvinces}
        field="name"
        onChange={(e) => onChange(e.value)}
        placeholder={placeholder}
        className="w-full"
        inputClassName="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        panelClassName="bg-white shadow-lg rounded-lg mt-1"
        disabled={disabled || !departmentId}
        dropdown
        forceSelection
      />
    </div>
  );
};