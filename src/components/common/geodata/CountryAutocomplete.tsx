import React, { useState, useEffect } from 'react';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import { geodataService } from '../../../services/rethinking/geodata.service';
import { Country } from '../../../types/rethinking/geodata.types';

interface CountryAutocompleteProps {
  value: Country | null;
  onChange: (value: Country | null) => void;
  placeholder?: string;
  className?: string;
}

export const CountryAutocomplete: React.FC<CountryAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Seleccionar país',
  className = '',
}) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async (search?: string) => {
    setLoading(true);
    try {
      const data = await geodataService.getCountries({ search });
      setCountries(data);
      setFilteredCountries(data);
    } catch (error) {
      console.error('Error loading countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchCountries = (event: AutoCompleteCompleteEvent) => {
    loadCountries(event.query);
  };

  return (
    <div className={`w-full ${className}`}>
      <AutoComplete
        value={value}
        suggestions={filteredCountries}
        completeMethod={searchCountries}
        field="name"
        onChange={(e) => onChange(e.value)}
        placeholder={placeholder}
        className="w-full"
        inputClassName="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        panelClassName="bg-white shadow-lg rounded-lg mt-1"
        dropdown
        forceSelection
      />
    </div>
  );
};