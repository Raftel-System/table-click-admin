// TableSelectorDialog.tsx - Sélection rapide des tables avec plan de salle
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Grid3X3,
  Sun,
  Users,
  CheckCircle,
  X,
  Utensils,
  Coffee,
  MapPin
} from 'lucide-react';

interface TableSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTable: (tableNumber: string) => void;
  currentTable?: string;
  occupiedTables?: string[]; // Tables actuellement occupées
}

// 🎯 Configuration des tables basée sur vos captures d'écran
const RESTAURANT_LAYOUT = {
  salle: {
    name: "Salle - RDC",
    icon: <Utensils size={16} />,
    color: "bg-gray-500/30 text-gray-200",
    headerColor: "bg-blue-600 text-white",
    tables: [
      // Première rangée (BAR et tables rondes)
      { number: "BAR2", type: "bar", position: { row: 0, col: 0 }, capacity: 5 },
      { number: "BAR1", type: "bar", position: { row: 0, col: 1 }, capacity: 5 },
      { number: "12.1", type: "round", position: { row: 0, col: 2 }, capacity: 2 },
      { number: "12", type: "square", position: { row: 0, col: 3 }, capacity: 2 },
      { number: "5.1", type: "round", position: { row: 0, col: 4 }, capacity: 2 },
      { number: "05", type: "square", position: { row: 0, col: 5 }, capacity: 3 },
      
      // Deuxième rangée
      { number: "RONDE 5", type: "round", position: { row: 1, col: 0 }, capacity: 2 },
      { number: "1.1", type: "round", position: { row: 1, col: 2 }, capacity: 2 },
      { number: "11", type: "square", position: { row: 1, col: 3 }, capacity: 2 },
      { number: "6.1", type: "round", position: { row: 1, col: 4 }, capacity: 2 },
      { number: "06", type: "square", position: { row: 1, col: 5 }, capacity: 4 },
      
      // Troisième rangée
      { number: "RONDE 1", type: "round", position: { row: 2, col: 0 }, capacity: 2 },
      { number: "RONDE 3", type: "round", position: { row: 2, col: 1 }, capacity: 2 },
      { number: "10.1", type: "round", position: { row: 2, col: 2 }, capacity: 2 },
      { number: "10", type: "square", position: { row: 2, col: 3 }, capacity: 2 },
      { number: "7.1", type: "round", position: { row: 2, col: 4 }, capacity: 2 },
      { number: "07", type: "square", position: { row: 2, col: 5 }, capacity: 4 },
      
      // Quatrième rangée
      { number: "RONDE 2", type: "round", position: { row: 3, col: 0 }, capacity: 2 },
      { number: "RONDE 4", type: "round", position: { row: 3, col: 1 }, capacity: 2 },
      { number: "9.1", type: "round", position: { row: 3, col: 2 }, capacity: 2 },
      { number: "09", type: "square", position: { row: 3, col: 3 }, capacity: 4 },
      { number: "8.1", type: "round", position: { row: 3, col: 4 }, capacity: 2 },
      { number: "08", type: "square", position: { row: 3, col: 5 }, capacity: 2 }
    ]
  },
  terrasse: {
    name: "Terrasse",
    icon: <Sun size={16} />,
    color: "bg-yellow-500/30 text-yellow-100",
    headerColor: "bg-yellow-600 text-black",
    tables: [
      // Tables terrasse basées sur la deuxième image
      { number: "T1", type: "round", position: { row: 0, col: 0 }, capacity: 2 },
      { number: "T2", type: "round", position: { row: 0, col: 1 }, capacity: 2 },
      { number: "T3", type: "round", position: { row: 0, col: 2 }, capacity: 2 },
      { number: "T4", type: "square", position: { row: 0, col: 3 }, capacity: 4 },
      { number: "T5", type: "round", position: { row: 0, col: 4 }, capacity: 2 },
      { number: "T6", type: "round", position: { row: 0, col: 5 }, capacity: 2 },
      { number: "T7", type: "square", position: { row: 0, col: 6 }, capacity: 4 },
      
      // Deuxième rangée terrasse
      { number: "T8", type: "round", position: { row: 1, col: 5 }, capacity: 2 },
      { number: "T9", type: "square", position: { row: 1, col: 3 }, capacity: 4 },
      { number: "T10", type: "round", position: { row: 1, col: 1 }, capacity: 2 },
      { number: "T11", type: "round", position: { row: 1, col: 0 }, capacity: 2 }
    ]
  }
};

const TableSelectorDialog: React.FC<TableSelectorDialogProps> = ({
  isOpen,
  onClose,
  onSelectTable,
  currentTable,
  occupiedTables = []
}) => {
  const [selectedZone, setSelectedZone] = useState<'salle' | 'terrasse'>('salle');

  // 🎯 Fonction pour rendre une table individuelle
  const renderTable = (table: any, zone: 'salle' | 'terrasse') => {
    const isOccupied = occupiedTables.includes(table.number) || table.occupied;
    const isSelected = currentTable === table.number;
    const isBarTable = table.type === 'bar';
    const isRoundTable = table.type === 'round';
    
    // Styles basés sur les captures d'écran
    const getTableStyle = () => {
      if (isOccupied) {
        return zone === 'terrasse' 
          ? "bg-yellow-600 text-black border-yellow-700" 
          : "bg-blue-600 text-white border-blue-700";
      }
      if (isSelected) {
        return "bg-green-500 text-white border-green-600 ring-2 ring-green-400";
      }
      return zone === 'terrasse'
        ? "bg-gray-600 text-white border-gray-500 hover:bg-yellow-500/20 hover:border-yellow-400"
        : "bg-gray-600 text-white border-gray-500 hover:bg-blue-500/20 hover:border-blue-400";
    };

    return (
      <div
        key={table.number}
        className="relative"
        style={{
          gridRow: table.position.row + 1,
          gridColumn: table.position.col + 1
        }}
      >
        <Button
          onClick={() => !isOccupied && onSelectTable(table.number)}
          disabled={isOccupied}
          className={`
            w-full h-20 p-2 border-2 transition-all duration-200 relative
            ${isRoundTable ? 'rounded-full' : isBarTable ? 'rounded-lg' : 'rounded-lg'}
            ${getTableStyle()}
            ${isOccupied ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-105'}
          `}
        >
          {/* Icône de table avec ticket si occupée */}
          <div className="absolute top-1 left-1">
            {isOccupied && (
              <div className="w-4 h-6 bg-white rounded-sm border border-gray-300 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 rounded-t-sm"></div>
                <div className="absolute top-1 left-0.5 w-3 h-0.5 bg-gray-400 rounded"></div>
                <div className="absolute top-2 left-0.5 w-2 h-0.5 bg-gray-400 rounded"></div>
                <Users size={8} className="absolute bottom-0.5 right-0.5 text-gray-500" />
              </div>
            )}
          </div>

          {/* Numéro de table */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-xs font-medium mb-1">Table</div>
            <div className="text-lg font-bold">{table.number}</div>
          </div>

          {/* Indicateur de capacité */}
          <div className="absolute bottom-1 right-1 flex items-center gap-1">
            <Users size={10} />
            <span className="text-xs">{table.capacity}</span>
          </div>

          {/* Badge de statut */}
          {isOccupied && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 py-0">
              Occupée
            </Badge>
          )}
          
          {isSelected && (
            <CheckCircle size={16} className="absolute -top-2 -right-2 text-green-400" />
          )}
        </Button>
      </div>
    );
  };

  // 🎯 Fonction pour rendre une zone (salle ou terrasse)
  const renderZone = (zoneKey: 'salle' | 'terrasse') => {
    const zone = RESTAURANT_LAYOUT[zoneKey];
    const maxRow = Math.max(...zone.tables.map(t => t.position.row));
    const maxCol = Math.max(...zone.tables.map(t => t.position.col));

    return (
      <div className="space-y-4">
        {/* Header de la zone */}
        <Card className={`${zone.headerColor} border-none`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-center gap-2">
              {zone.icon}
              <span className="font-bold text-lg">{zone.name}</span>
            </div>
          </CardContent>
        </Card>

        {/* Grille des tables */}
        <div 
          className={`grid gap-3 p-6 rounded-2xl ${zone.color} border border-gray-600`}
          style={{
            gridTemplateRows: `repeat(${maxRow + 1}, minmax(0, 1fr))`,
            gridTemplateColumns: `repeat(${maxCol + 1}, minmax(0, 1fr))`
          }}
        >
          {zone.tables.map(table => renderTable(table, zoneKey))}
        </div>

        {/* Légende */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-600 rounded border border-gray-500"></div>
            <span>Libre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded border ${
              zoneKey === 'terrasse' ? 'bg-yellow-600 border-yellow-700' : 'bg-blue-600 border-blue-700'
            }`}></div>
            <span>Occupée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded border border-green-600"></div>
            <span>Sélectionnée</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] bg-gray-900/98 border-gray-700 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin size={28} className="text-blue-400" />
              Sélectionner une table
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full p-2"
            >
              <X size={20} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sélecteur de zone */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => setSelectedZone('salle')}
              className={`h-12 px-6 rounded-xl transition-all duration-200 ${
                selectedZone === 'salle'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
              }`}
            >
              <Utensils size={20} className="mr-2" />
              Salle principale
            </Button>
            
            <Button
              onClick={() => setSelectedZone('terrasse')}
              className={`h-12 px-6 rounded-xl transition-all duration-200 ${
                selectedZone === 'terrasse'
                  ? 'bg-yellow-600 text-black border-yellow-500'
                  : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
              }`}
            >
              <Sun size={20} className="mr-2" />
              Terrasse
            </Button>
          </div>

          {/* Affichage de la zone sélectionnée */}
          {renderZone(selectedZone)}

          {/* Informations supplémentaires */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {RESTAURANT_LAYOUT.salle.tables.length + RESTAURANT_LAYOUT.terrasse.tables.length}
                  </div>
                  <div className="text-sm text-gray-400">Tables totales</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {occupiedTables.length + RESTAURANT_LAYOUT.terrasse.tables.filter(t => t.occupied).length}
                  </div>
                  <div className="text-sm text-gray-400">Tables occupées</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {(RESTAURANT_LAYOUT.salle.tables.length + RESTAURANT_LAYOUT.terrasse.tables.length) - 
                     (occupiedTables.length + RESTAURANT_LAYOUT.terrasse.tables.filter(t => t.occupied).length)}
                  </div>
                  <div className="text-sm text-gray-400">Tables libres</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table sélectionnée */}
          {currentTable && (
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={24} className="text-green-400" />
                    <div>
                      <div className="text-lg font-semibold text-white">Table {currentTable} sélectionnée</div>
                      <div className="text-sm text-green-400">Cliquez sur "Confirmer" pour valider votre choix</div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={onClose}
                    className="bg-green-500 hover:bg-green-400 text-white px-6 py-2 rounded-xl"
                  >
                    Confirmer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TableSelectorDialog;