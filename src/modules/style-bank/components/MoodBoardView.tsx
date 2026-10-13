import { useState } from 'react';
import { Plus, Share2, CheckCircle2, AlertTriangle, X, Palette, LayoutGrid, Eye, EyeOff } from 'lucide-react';
import { useShowroomCurationStore } from '../stores/useShowroomCurationStore';
import { MoodBoardAnnotation } from './MoodBoardAnnotation';
import { getStylesForMoodBoard } from '../data/mockStyleBank';
import type { MoodBoard } from '../types/showroom-types';
import { Input, Button, EmptyState } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

export function MoodBoardView() {
  const {
    moodBoards,
    activePod,
    activeSeason,
    createMoodBoard,
    deleteMoodBoard,
    convertMoodBoardToShortlist,
    setCurateViewTab,
    addMoodBoardAnnotation,
  } = useShowroomCurationStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardTheme, setNewBoardTheme] = useState('');

  const filteredBoards = activePod
    ? moodBoards.filter((b) => b.podId === activePod)
    : moodBoards;

  const handleCreate = () => {
    if (!newBoardName.trim()) return;
    createMoodBoard({
      name: newBoardName,
      theme: newBoardTheme,
      description: newBoardTheme,
      colorStory: ['#1a1a2e', '#16213e', '#e94560', '#f5f5dc', '#0f3460', '#533483'],
      styleIds: [],
      annotations: [],
      createdBy: 'Current User',
      podId: activePod || 'MW-2',
      season: activeSeason,
      totalRevenue: 0,
      constraintCheck: { passing: 0, total: 0, issues: [] },
    });
    setNewBoardName('');
    setNewBoardTheme('');
    setShowCreateForm(false);
  };

  // Handler: cross-link from board to styles tab
  const handleOpenInStyles = () => {
    setCurateViewTab('styles');
  };

  return (
    <div className="bg-gray-50">
      {/* Inline header (no page-level header since this is a tab within CurationWorkflow) */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        {/* eslint-disable-next-line design-system/prefer-section-header -- compact inline header for tab content with create button */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            {filteredBoards.length} board{filteredBoards.length !== 1 ? 's' : ''}
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Board
          </Button>
        </div>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Create New Mood Board</h3>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Board name..."
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                className="py-2 text-sm"
              />
              {/* eslint-disable-next-line no-restricted-syntax -- no Textarea primitive yet */}
              <textarea
                placeholder="Theme description..."
                value={newBoardTheme}
                onChange={(e) => setNewBoardTheme(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus-kb:ring-2 focus-kb:ring-primary resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreate}
                  disabled={!newBoardName.trim()}
                >
                  Create Board
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Board grid */}
      <div className="p-4">
        {filteredBoards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredBoards.map((board) => (
              <MoodBoardCard
                key={board.id}
                board={board}
                onConvert={() => convertMoodBoardToShortlist(board.id)}
                onDelete={() => deleteMoodBoard(board.id)}
                onOpenInStyles={handleOpenInStyles}
                onAnnotate={(styleId, note) => addMoodBoardAnnotation(board.id, styleId, note)}
              />
            ))}
          </div>
        ) : (
          /* Empty state (W17) */
          <EmptyState
            icon={Palette}
            title="No mood boards yet"
            description="Create a mood board to group styles into thematic collections."
          />
        )}

        {/* Show create button below empty state */}
        {filteredBoards.length === 0 && (
          <div className="text-center mt-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Create Board
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface MoodBoardCardProps {
  board: MoodBoard;
  onConvert: () => void;
  onDelete: () => void;
  onOpenInStyles: () => void;
  onAnnotate: (styleId: string, note: string) => void;
}

function MoodBoardCard({ board, onConvert, onDelete, onOpenInStyles, onAnnotate }: MoodBoardCardProps) {
  const boardStyles = getStylesForMoodBoard(board.id);
  const [showAnnotations, setShowAnnotations] = useState(false);

  // Build annotations map for quick lookup
  const annotationMap = new Map(
    board.annotations.map((a) => [a.styleId, { note: a.note, author: a.author, updatedAt: a.updatedAt }])
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200">
      <div className="p-4">
        {/* Header with style count */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">{board.name}</h3>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                {board.styleIds.length} style{board.styleIds.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{board.theme}</p>
          </div>
          <div className="flex items-center gap-1">
            {/* Annotations toggle */}
            <button
              onClick={() => setShowAnnotations((prev) => !prev)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showAnnotations ? 'Hide annotations' : 'Show annotations'}
            >
              {showAnnotations ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Delete board"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Style thumbnails with annotations */}
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- mood board style thumbnail grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3">
          {boardStyles.slice(0, 7).map((style) => {
            const annotation = annotationMap.get(style.product.id);
            return (
              <div key={style.product.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                <img
                  src={style.product.thumbnailImage || style.product.primaryImage}
                  alt={style.product.name}
                  className="w-full h-full object-cover"
                />
                {/* MoodBoardAnnotation overlay */}
                <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity">
                  <MoodBoardAnnotation
                    annotation={annotation}
                    onSave={(note) => onAnnotate(style.product.id, note)}
                  />
                </div>
              </div>
            );
          })}
          <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors cursor-pointer">
            <Plus className="w-5 h-5" />
          </div>
        </div>

        {/* Annotations list view (toggle) */}
        {showAnnotations && board.annotations.length > 0 && (
          <div className="mb-3 space-y-1.5 bg-gray-50 rounded-lg p-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Annotations</p>
            {board.annotations.map((ann, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <span className="text-gray-400 shrink-0">{ann.author}:</span>
                <span className="text-gray-700 line-clamp-2">{ann.note}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span>{board.styleIds.length} styles</span>
          <span>{formatCurrency(board.totalRevenue)}</span>
        </div>

        {/* Color story */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1">
            {board.colorStory.map((color, idx) => (
              <div
                key={idx}
                className="w-4 h-4 rounded-full border border-gray-200"
                // eslint-disable-next-line no-restricted-syntax -- dynamic color
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Constraint check */}
        <div className="flex items-center gap-1.5 mb-4 text-xs">
          {board.constraintCheck.issues.length === 0 ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-600">
                {board.constraintCheck.passing}/{board.constraintCheck.total} pass
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-600">
                {board.constraintCheck.passing}/{board.constraintCheck.total} pass — {board.constraintCheck.issues[0]}
              </span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onOpenInStyles}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Open in Styles
          </button>
          <button className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2">
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
          <button
            onClick={onConvert}
            className="flex-1 px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2"
          >
            Add to Shortlist
          </button>
        </div>
      </div>
    </div>
  );
}
