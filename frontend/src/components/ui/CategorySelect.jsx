import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Plus, Check, X } from 'lucide-react';
import { productAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../LoadingSpinner';

const CategorySelect = ({ 
  value, 
  onChange, 
  error, 
  placeholder,
  required = false,
  disabled = false 
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch categories from API
  const { 
    data: categoriesData, 
    loading: loadingCategories, 
    error: categoriesError,
    refetch: refetchCategories 
  } = useApi(() => productAPI.getCategories(), []);

  const categories = categoriesData?.categories || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowAddNew(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter categories based on search term
  const filteredCategories = categories.filter(cat =>
    cat.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if search term matches any existing category
  const exactMatch = categories.find(cat => 
    cat.category.toLowerCase() === searchTerm.toLowerCase()
  );

  const handleCategorySelect = (category) => {
    onChange(category);
    setIsOpen(false);
    setSearchTerm('');
    setShowAddNew(false);
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsCreating(true);
    try {
      // Create the new category using the dedicated API endpoint
      await productAPI.createCategory({ name: newCategoryName.trim() });

      // Refetch categories to include the new one
      await refetchCategories();

      // Select the new category
      handleCategorySelect(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddNew(false);
    } catch (error) {
      console.error('Error creating category:', error);
      // Still allow the user to use the category even if the API call failed
      handleCategorySelect(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddNew(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showAddNew) {
        handleAddNewCategory();
      } else if (filteredCategories.length > 0) {
        handleCategorySelect(filteredCategories[0].category);
      } else if (searchTerm.trim() && !exactMatch) {
        setNewCategoryName(searchTerm.trim());
        setShowAddNew(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setShowAddNew(false);
      setSearchTerm('');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`relative w-full px-3 py-2 border rounded-md shadow-sm cursor-pointer transition-colors ${
          error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white hover:border-gray-400'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className={`block truncate ${value ? 'text-gray-900' : 'text-gray-500'}`}>
            {value || placeholder || t('products.selectCategory')}
          </span>
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('products.searchCategories')}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Categories List */}
          <div className="max-h-40 overflow-y-auto">
            {loadingCategories ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="small" />
              </div>
            ) : categoriesError ? (
              <div className="px-3 py-2 text-sm text-red-600">
                {t('products.errorLoadingCategories')}
              </div>
            ) : filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                  onClick={() => handleCategorySelect(cat.category)}
                >
                  <span className="flex-1">{cat.category}</span>
                  <span className="text-xs text-gray-500">
                    ({cat.productCount} {t('products.products')})
                  </span>
                  {value === cat.category && (
                    <Check className="h-4 w-4 text-blue-600 ml-2" />
                  )}
                </div>
              ))
            ) : searchTerm && !exactMatch ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                {t('products.noCategoriesFound')}
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                {t('products.startTypingToSearch')}
              </div>
            )}
          </div>

          {/* Add New Category Section */}
          {searchTerm && !exactMatch && !showAddNew && (
            <div className="border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setNewCategoryName(searchTerm.trim());
                  setShowAddNew(true);
                }}
                className="w-full px-3 py-2 text-sm text-left text-blue-600 hover:bg-blue-50 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('products.addNewCategory')}: "{searchTerm}"
              </button>
            </div>
          )}

          {/* Add New Category Form */}
          {showAddNew && (
            <div className="border-t border-gray-200 p-3">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewCategory();
                    } else if (e.key === 'Escape') {
                      setShowAddNew(false);
                      setNewCategoryName('');
                    }
                  }}
                  placeholder={t('products.enterCategoryName')}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddNewCategory}
                  disabled={!newCategoryName.trim() || isCreating}
                  className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isCreating ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddNew(false);
                    setNewCategoryName('');
                  }}
                  className="px-2 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {t('products.addCategoryHint')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategorySelect;
