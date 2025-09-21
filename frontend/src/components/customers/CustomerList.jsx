import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDirection } from '../../hooks/useDirection';
import { usePaginatedApi } from '../../hooks/useApi';
import { customerAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import PhoneNumber from '../common/PhoneNumber';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import Badge from '../ui/Badge';
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  MoreHorizontal,
  UserPlus
} from 'lucide-react';
import { formatDate as baseDateFormat, calculateAge, formatNumber } from '../../utils/formatters';

const CustomerList = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  // Create localized formatDate function
  const formatDate = (date, options = {}) => {
    const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
    return baseDateFormat(date, options, locale);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  const {
    data: customers,
    pagination,
    loading,
    error,
    updateParams,
    goToPage,
    nextPage,
    prevPage
  } = usePaginatedApi(customerAPI.getAll, {
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  });

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateParams({ search: searchTerm, sortBy, sortOrder });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, sortBy, sortOrder, updateParams]);

  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setSortBy(field);
    setSortOrder(newOrder);
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerAPI.delete(customerId);
        // Refresh the list
        updateParams({});
      } catch (error) {
        alert('Failed to delete customer: ' + error['response'].data.message);
      }
    }
  };

  if (loading && !customers.length) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-sm text-red-600">
          Failed to load customers: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        {/* <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('customers.title')}
              </CardTitle>
              <CardDescription>
                {t('customers.description')}
              </CardDescription>
            </div>
            <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => navigate('/customers/new')}>
              {t('customers.addCustomer')}
            </Button>
          </div>
        </CardHeader> */}
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="flex flex-row sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder={t('customers.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="form-select"
              >
                <option value="createdAt-DESC">{t('customers.NewestFirst')}</option>
                <option value="createdAt-ASC">{t('customers.OldestFirst')}</option>
                <option value="firstName-ASC">{t('customers.NameAZ')}</option>
                <option value="firstName-DESC">{t('customers.NameZA')}</option>
              </select>
              {/* <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
                {t('common.filter')}
              </Button> */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        {customers.length === 0 ? (
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Users className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {t('customers.noCustomersFound')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? t('customers.adjustSearch') : t('customers.getStarted')}
            </p>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/customers/new')}>
              {t('customers.addCustomer')}
            </Button>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('firstName')}
                    >
                      <div className="flex items-center gap-2">
                        {t('customers.CustomerName')}
                        {sortBy === 'firstName' && (
                          <span className="text-xs">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>{t('customers.contact')}</TableHead>
                    <TableHead>{t('customers.location')}</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-2">
                        {t('customers.joined')}
                        {sortBy === 'createdAt' && (
                          <span className="text-xs">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>{t('customers.Orders')}</TableHead>
                    <TableHead className="w-[100px]">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <CustomerTableRow
                      key={customer.id}
                      customer={customer}
                      onDelete={handleDelete}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden p-4">
              <div className="space-y-4">
                {customers.map((customer) => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Mobile pagination */}
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="outline"
                  onClick={prevPage}
                  disabled={!pagination.hasPrev}
                  leftIcon={isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline"
                  onClick={nextPage}
                  disabled={!pagination.hasNext}
                  rightIcon={isArabic ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                >
                  {t('common.next')}
                </Button>
              </div>

              {/* Desktop pagination */}
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('pagination.showingPage')} <span className="font-medium text-foreground">{formatNumber(pagination.currentPage)}</span> {t('pagination.of')}{' '}
                    <span className="font-medium text-foreground">{formatNumber(pagination.totalPages)}</span> ({formatNumber(pagination.totalItems)} {t('pagination.totalCustomers')})
                  </p>
                </div>
                <div>
                  <nav className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={!pagination.hasPrev}
                    >
                      {isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, pagination.currentPage - 2) + i;
                      if (pageNum > pagination.totalPages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={!pagination.hasNext}
                    >
                      {isArabic ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Table Row Component
const CustomerTableRow = ({ customer, onDelete }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  // Create localized formatDate function
  const formatDate = (date, options = {}) => {
    const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
    return baseDateFormat(date, options, locale);
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          {/* Removed initials avatar */}
          <div>
            <div className="font-medium text-muted-foreground">
              {customer.firstName} {customer.lastName}
            </div>
            {/* {customer.dateOfBirth && (
              <div className="text-sm text-muted-foreground">
                {t('customers.age')} {calculateAge(customer.dateOfBirth)}
              </div>
            )} */}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          {customer.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{customer.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <PhoneNumber phone={customer.phone} />
          </div>
        </div>
      </TableCell>
      <TableCell>
        {customer.city && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{customer.city}</span>
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">{formatDate(customer.createdAt)}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          {customer.orders?.length || 0} {t('customers.Orders')}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
          className="text-blue-600"
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/customers/${customer.id}`)}
            title={t('common.view')}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
          className="text-green-500 "
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/customers/${customer.id}/edit`)}
            title={t('common.edit')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
          
            variant="ghost"
            size="sm"
            onClick={() => onDelete(customer.id)}
            title={t('common.delete')}
            className=" text-red-600 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

// Mobile Card Component
const CustomerCard = ({ customer, onDelete }) => {
  const navigate = useNavigate();
  const { isRTL } = useDirection();
  const { i18n } = useTranslation();

  // Create localized formatDate function
  const formatDate = (date, options = {}) => {
    const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
    return baseDateFormat(date, options, locale);
  };

  return (
    <Card className="hover:shadow-medium transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="text-lg font-medium">
                {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                {customer.firstName} {customer.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {customer.orders?.length || 0} orders • Joined {formatDate(customer.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/customers/${customer.id}/edit`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(customer.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {customer.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{customer.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <PhoneNumber phone={customer.phone} />
          </div>
          {customer.city && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{customer.city}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerList;
