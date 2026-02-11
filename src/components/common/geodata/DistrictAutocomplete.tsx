import React, { useState, useEffect } from 'react';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import { geodataService } from '../../../services/rethinking/geodata.service';
import { District } from '../../../types/rethinking/geodata.types';

interface DistrictAutocompleteProps {
  value: District | null;
  onChange: (value: District | null) => void;
  provinceId?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const DistrictAutocomplete: React.FC<DistrictAutocompleteProps> = ({
  value,
  onChange,
  provinceId,
  placeholder = 'Seleccionar distrito',
  className = '',
  disabled = false,
}) => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (provinceId) {
      loadDistricts();
    } else {
      setDistricts([]);
      setFilteredDistricts([]);
      onChange(null);
    }
  }, [provinceId]);

  const loadDistricts = async (search?: string) => {
    setLoading(true);
    try {
      const data = await geodataService.getDistricts({ search, provinceId });
      setDistricts(data);
      setFilteredDistricts(data);
    } catch (error) {
      console.error('Error loading districts:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchDistricts = (event: AutoCompleteCompleteEvent) => {
    loadDistricts(event.query);
  };

  return (
    <div className={`w-full ${className}`}>
      <AutoComplete
        value={value}
        suggestions={filteredDistricts}
        completeMethod={searchDistricts}
        field="name"
        onChange={(e) => onChange(e.value)}
        placeholder={placeholder}
        className="w-full"
        inputClassName="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        panelClassName="bg-white shadow-lg rounded-lg mt-1"
        disabled={disabled || !provinceId}
        dropdown
        forceSelection
      />
    </div>
  );
};