import React, { useState } from 'react';
import { StickyNote, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface SpecialInstructionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  itemName?: string;
  defaultNote?: string;
}

const SpecialInstructionDialog: React.FC<SpecialInstructionDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  itemName,
  defaultNote = ''
}) => {
  const [note, setNote] = useState(defaultNote);

  const handleSave = () => {
    onSave(note.trim());
    setNote('');
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-gray-900/98 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <StickyNote size={20} className="text-yellow-400" />
            </div>
            <div>
              <div>Instructions spéciales</div>
              {itemName && (
                <div className="text-sm text-gray-400 font-normal">
                  pour "{itemName}"
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-white font-medium">
              Note personnalisée (optionnel)
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Pas d'oignons, cuisson bien cuite, allergies..."
              className="bg-gray-700/50 border-gray-600 text-white rounded-xl resize-none focus:border-yellow-500 focus:ring-yellow-500/20"
              rows={4}
              maxLength={200}
            />
            <div className="text-right text-xs text-gray-400">
              {note.length}/200 caractères
            </div>
          </div>

          {/* Suggestions rapides */}
          <div className="space-y-2">
            <Label className="text-white font-medium text-sm">
              Suggestions rapides
            </Label>
            <div className="flex flex-wrap gap-2">
              {[
                'Pas d\'oignons',
                'Peu épicé',
                'Très épicé',
                'Sans sauce',
                'Sauce à part',
                'Bien cuit',
                'Saignant'
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  onClick={() => {
                    const newNote = note.trim() 
                      ? `${note.trim()}, ${suggestion}`
                      : suggestion;
                    if (newNote.length <= 200) {
                      setNote(newNote);
                    }
                  }}
                  className="h-8 px-3 text-xs bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white rounded-lg"
                >
                  + {suggestion}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 rounded-xl"
            >
              <X size={16} className="mr-2" />
              Ignorer
            </Button>
            
            <Button
              onClick={handleSave}
              className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-medium rounded-xl"
            >
              <Save size={16} className="mr-2" />
              Valider
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpecialInstructionDialog;