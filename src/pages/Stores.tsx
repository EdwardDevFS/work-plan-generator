import React, { useState } from 'react';
import { ConfirmDialog } from 'primereact/confirmdialog';
import StoreList from '../components/stores/StoreList';
import StoreForm from '../components/stores/StoreForm';
import StoreMap from '../components/stores/StoreMap';
import StoreUserManagement from '../components/stores/StoreUserManagement';
import { Store } from '../types/store.types';

const Stores: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [mapStores, setMapStores] = useState<Store[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);


  const handleCreateStore = () => {
    setSelectedStore(null);
    setShowForm(true);
  };

  const handleEditStore = (store: Store) => {
    setSelectedStore(store);
    setShowForm(true);
  };

  const handleFormSave = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedStore(null);
  };

  const handleViewMap = (stores: Store[]) => {
    const normalized = stores.map(s => ({
      ...s,
      latitude:  Number(s.latitude),
      longitude: Number(s.longitude),
    })).filter(s => 
      Number.isFinite(s.latitude) && 
      Number.isFinite(s.longitude)
    );
    setMapStores(normalized);
    setShowMap(true);
  };

  const handleMapClose = () => {
    setShowMap(false);
    setMapStores([]);
  };

  const handleManageUsers = (store: Store) => {
    setSelectedStore(store);
    setShowUserManagement(true);
  };

  const handleUserManagementClose = () => {
    setShowUserManagement(false);
    setSelectedStore(null);
  };

  return (
    <div className="p-6">
      <ConfirmDialog />

      <StoreList
        onCreateStore={handleCreateStore}
        onEditStore={handleEditStore}
        onViewMap={handleViewMap}
        onManageUsers={handleManageUsers}
        refreshTrigger={refreshTrigger}
      />

      <StoreForm
        visible={showForm}
        store={selectedStore}
        onHide={handleFormClose}
        onSave={handleFormSave}
      />

      <StoreMap
        visible={showMap}
        stores={mapStores}
        onHide={handleMapClose}
      />

      <StoreUserManagement
        visible={showUserManagement}
        store={selectedStore}
        onHide={handleUserManagementClose}
      />
    </div>
  );
};

export default Stores;