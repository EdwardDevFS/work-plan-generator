// src/components/common/GenericAutocomplete.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import { classNames } from 'primereact/utils';

interface GenericAutocompleteProps<Option extends object> {
  options: Option[];
  displayField: keyof Option | ((option: Option) => string);
  value: Option | null;
  onChange: (value: Option | null) => void;
  placeholder?: string;
  loading?: boolean; // lo mantenemos para uso externo (ej. spinner wrapper)
  className?: string;
  inputClassName?: string;
  dropdown?: boolean;
  forceSelection?: boolean;
  minLength?: number;
  delay?: number;
  emptyMessage?: string;
  itemTemplate?: (option: Option) => React.ReactNode;
  localFilter?: boolean;
}

function GenericAutocomplete<Option extends object>({
  options,
  displayField,
  value,
  onChange,
  placeholder = 'Buscar...',
  loading = false,
  className = '',
  inputClassName = '',
  dropdown = true,
  forceSelection = true,
  minLength = 1,
  delay = 250,
  emptyMessage = 'No se encontraron resultados',
  itemTemplate,
  localFilter = true,
}: GenericAutocompleteProps<Option>) {
  const [query, setQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);

  const getDisplayText = useCallback(
    (option: Option | null): string => {
      if (!option) return '';
      if (typeof displayField === 'function') return displayField(option);
      const val = option[displayField];
      return val != null ? String(val) : '';
    },
    [displayField]
  );

  const filterLocally = useCallback(
    (q: string) => {
      if (!q.trim() || q.length < minLength) {
        setFilteredOptions(options);
        return;
      }
      const lowerQuery = q.toLowerCase().trim();
      const filtered = options.filter((option) =>
        getDisplayText(option).toLowerCase().includes(lowerQuery)
      );
      setFilteredOptions(filtered);
    },
    [options, minLength, getDisplayText]
  );

  const completeMethod = useCallback(
    (e: AutoCompleteCompleteEvent) => {
      const q = e.query;
      setQuery(q);
      if (localFilter) {
        filterLocally(q);
      }
    },
    [localFilter, filterLocally]
  );

  useEffect(() => {
    if (localFilter) {
      filterLocally(query);
    } else {
      setFilteredOptions(options);
    }
  }, [options, localFilter, query, filterLocally]);

  return (
    <div className="relative">
      <AutoComplete
        value={value ? getDisplayText(value) : ''}
        suggestions={filteredOptions as any}
        completeMethod={completeMethod}
        onChange={(e) => {
          const newValue = e.value;
          if (!newValue) {
            onChange(null);
            return;
          }
          if (typeof newValue === 'object' && newValue !== null) {
            onChange(newValue as Option);
          } else {
            const match = options.find(opt => getDisplayText(opt) === String(newValue));
            onChange(match ?? null);
          }
        }}
        field={typeof displayField === 'string' ? String(displayField) : undefined}
        placeholder={placeholder}
        dropdown={dropdown}
        forceSelection={forceSelection}
        delay={delay}
        minLength={minLength}
        className={classNames('w-full', className)}
        inputClassName={inputClassName}
        itemTemplate={itemTemplate}
        emptyMessage={emptyMessage}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 pointer-events-none z-10">
          <i className="pi pi-spinner pi-spin text-3xl text-primary-500" />
        </div>
      )}
    </div>
  );
}

export default GenericAutocomplete;