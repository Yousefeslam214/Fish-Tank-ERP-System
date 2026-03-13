import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useAccounting } from './AccountingModule';
import { Search, Plus, FileText, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { mockJournalEntries, JournalEntry } from '../../mockData/accountingData';

export function JournalEntriesList() {
  const { t, language } = useAccounting();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const filteredEntries = mockJournalEntries.filter(entry => {
    const matchesSearch = 
      entry.entryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.descriptionAr.includes(searchQuery);
    
    const matchesType = typeFilter === 'all' || entry.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} EGP`;
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'HARVEST_COMPLETION': t('accounting.harvestCompletion'),
      'SALES_REVENUE': t('accounting.salesRevenue'),
      'COGS': t('accounting.costOfGoodsSold'),
      'MANUAL_ADJUSTMENT': t('accounting.manualAdjustment'),
      'FEED_PURCHASE': t('accounting.feedPurchase'),
      'LABOR': t('accounting.labor'),
      'UTILITIES': t('accounting.utilities'),
      'FINGERLING_PURCHASE': t('accounting.fingerlingPurchase')
    };
    return typeMap[type] || type;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'BALANCED') {
      return (
        <Badge variant="outline" className="border-green-600 text-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t('accounting.balanced')}
        </Badge>
      );
    }
    if (status === 'REQUIRES_APPROVAL') {
      return (
        <Badge variant="outline" className="border-orange-600 text-orange-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          {t('accounting.requiresApproval')}
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        {status}
      </Badge>
    );
  };

  const handleViewDetails = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowDetailsDialog(true);
  };

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t('accounting.journalEntries')}
            </CardTitle>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t('accounting.createManual')}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={`${t('accounting.search')}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('accounting.allTypes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('accounting.allTypes')}</SelectItem>
                <SelectItem value="HARVEST_COMPLETION">{t('accounting.harvestCompletion')}</SelectItem>
                <SelectItem value="SALES_REVENUE">{t('accounting.salesRevenue')}</SelectItem>
                <SelectItem value="COGS">{t('accounting.costOfGoodsSold')}</SelectItem>
                <SelectItem value="MANUAL_ADJUSTMENT">{t('accounting.manualAdjustment')}</SelectItem>
                <SelectItem value="FEED_PURCHASE">{t('accounting.feedPurchase')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Journal Entries List */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                {/* Entry Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{entry.entryNumber}</span>
                      <span className="text-sm text-gray-600">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {getTypeLabel(entry.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {language === 'ar' ? entry.descriptionAr : entry.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(entry.amount)}</div>
                    </div>
                    {getStatusBadge(entry.status)}
                  </div>
                </div>

                {/* Journal Lines Summary */}
                <div className="bg-gray-50 rounded p-3 space-y-2">
                  {entry.lines.map((line, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <span className="font-medium">
                          {line.debit > 0 ? t('accounting.debit') : t('accounting.credit')}
                        </span>
                        {' '}
                        <span className="text-gray-600">
                          {language === 'ar' ? line.accountNameAr : line.accountName}
                        </span>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(line.debit > 0 ? line.debit : line.credit)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Related Documents */}
                {entry.relatedDocs && (
                  <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
                    {entry.relatedDocs.orderId && (
                      <span>Order: {entry.relatedDocs.orderId}</span>
                    )}
                    {entry.relatedDocs.lotNumber && (
                      <span>Lot: {entry.relatedDocs.lotNumber}</span>
                    )}
                    {entry.relatedDocs.tankId && (
                      <span>Tank: {entry.relatedDocs.tankId}</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(entry)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {t('accounting.viewDetails')}
                  </Button>
                  {entry.status === 'REQUIRES_APPROVAL' && (
                    <>
                      <Button variant="outline" size="sm" className="text-green-600 border-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {t('accounting.approve')}
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-600">
                        {t('accounting.reject')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <span className="text-sm text-gray-600">
              Showing 1-{filteredEntries.length} of {mockJournalEntries.length}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Journal Entry Details Dialog */}
      {selectedEntry && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {t('accounting.journalEntries')} - {selectedEntry.entryNumber}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Entry Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">{t('accounting.entryNumber')}:</span>
                  <span className="ml-2 font-medium">{selectedEntry.entryNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('common.date')}:</span>
                  <span className="ml-2 font-medium">
                    {new Date(selectedEntry.date).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">{t('accounting.type')}:</span>
                  <span className="ml-2 font-medium">{getTypeLabel(selectedEntry.type)}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('common.status')}:</span>
                  <span className="ml-2">{getStatusBadge(selectedEntry.status)}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-600 text-sm">{t('accounting.description')}:</span>
                <p className="mt-1">
                  {language === 'ar' ? selectedEntry.descriptionAr : selectedEntry.description}
                </p>
              </div>

              {/* Accounting Entries Table */}
              <div>
                <h4 className="font-medium mb-2">Accounting Entries</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 text-sm">{t('accounting.accountName')}</th>
                        <th className="text-right p-3 text-sm">{t('accounting.debit')}</th>
                        <th className="text-right p-3 text-sm">{t('accounting.credit')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEntry.lines.map((line, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-3">
                            <div>
                              <div className="font-medium text-sm">
                                {language === 'ar' ? line.accountNameAr : line.accountName}
                              </div>
                              <div className="text-xs text-gray-600">[{line.accountCode}]</div>
                              {line.metadata && Object.keys(line.metadata).length > 0 && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {Object.entries(line.metadata).map(([key, value]) => (
                                    <div key={key}>• {key}: {value}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right font-medium">
                            {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                          </td>
                          <td className="p-3 text-right font-medium">
                            {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t bg-gray-50 font-bold">
                        <td className="p-3">{t('accounting.total')}</td>
                        <td className="p-3 text-right">
                          {formatCurrency(selectedEntry.lines.reduce((sum, l) => sum + l.debit, 0))}
                        </td>
                        <td className="p-3 text-right">
                          {formatCurrency(selectedEntry.lines.reduce((sum, l) => sum + l.credit, 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Trail */}
              <div className="text-xs text-gray-600 border-t pt-3">
                <div>Created: {new Date(selectedEntry.createdAt).toLocaleString()} by {selectedEntry.createdBy}</div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}