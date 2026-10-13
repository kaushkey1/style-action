import { useState } from "react";
import { Input, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { BrickRow, BuyerEditPayload } from "../api/rangeApi";

interface BrickReviewTableProps {
  bricks: BrickRow[];
  onSave?: (resultId: string, payload: BuyerEditPayload) => Promise<void>;
}

interface EditState {
  [resultId: string]: BuyerEditPayload;
}

export function BrickReviewTable({ bricks, onSave }: BrickReviewTableProps) {
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [editValues, setEditValues] = useState<EditState>({});
  const [savingRows, setSavingRows] = useState<Set<string>>(new Set());

  const handleEdit = (brick: BrickRow) => {
    setEditingRows((prev) => new Set(prev).add(brick.result_id));
    setEditValues((prev) => ({
      ...prev,
      [brick.result_id]: {
        buyer_options: brick.buyer.options ?? brick.system.options ?? 0,
        buyer_qty: brick.buyer.qty ?? brick.system.qty ?? 0,
        buyer_price_point_min: brick.buyer.price_min ?? brick.system.price_min ?? 0,
        buyer_price_point_max: brick.buyer.price_max ?? brick.system.price_max ?? 0,
      },
    }));
  };

  const handleCancel = (resultId: string) => {
    setEditingRows((prev) => {
      const next = new Set(prev);
      next.delete(resultId);
      return next;
    });
    setEditValues((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [resultId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSave = async (resultId: string) => {
    const payload = editValues[resultId];
    if (!payload || !onSave) return;

    setSavingRows((prev) => new Set(prev).add(resultId));
    try {
      await onSave(resultId, payload);
      handleCancel(resultId);
    } catch (error) {
      console.error("Failed to save brick:", error);
    } finally {
      setSavingRows((prev) => {
        const next = new Set(prev);
        next.delete(resultId);
        return next;
      });
    }
  };

  const updateEditValue = (resultId: string, field: keyof BuyerEditPayload, value: number) => {
    setEditValues((prev) => {
      const current = prev[resultId];
      if (!current) return prev;

      return {
        ...prev,
        [resultId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  if (bricks.length === 0) {
    return <div className="text-center py-12 text-sm text-gray-400">No bricks available</div>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="w-full border-collapse min-w-[1600px]">
            <thead>
              {/* Main Header Row */}
              <tr className="border-b border-gray-200">
                <th
                  rowSpan={3}
                  className="sticky left-0 z-10 px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 bg-gray-50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"
                >
                  Brick Name
                </th>
                <th
                  rowSpan={3}
                  className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 bg-gray-50"
                >
                  Silhouette
                </th>
                <th
                  rowSpan={3}
                  className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 bg-gray-50"
                >
                  Fabric
                </th>
                <th
                  rowSpan={3}
                  className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 bg-gray-50"
                >
                  Print
                </th>
                <th
                  rowSpan={3}
                  className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 bg-gray-50"
                >
                  Buying Model
                </th>
                <th
                  colSpan={6}
                  className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 bg-indigo-50"
                >
                  Price Point
                </th>
                <th
                  colSpan={3}
                  className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 bg-green-50"
                >
                  Option Count
                </th>
                <th
                  colSpan={3}
                  className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 bg-amber-50"
                >
                  Total Quantity
                </th>
                <th
                  rowSpan={3}
                  className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50"
                >
                  Source
                </th>
              </tr>

              {/* Second Level Headers */}
              <tr className="border-b border-gray-200">
                {/* Price Point second level */}
                <th
                  colSpan={2}
                  className="px-3 py-1.5 text-center text-[9px] font-medium text-gray-400 uppercase tracking-wider border-r border-gray-100 bg-indigo-50/50"
                >
                  Historical
                </th>
                <th
                  colSpan={2}
                  className="px-3 py-1.5 text-center text-[9px] font-medium text-gray-400 uppercase tracking-wider border-r border-gray-100 bg-indigo-50/50"
                >
                  Suggested
                </th>
                <th
                  colSpan={2}
                  className="px-3 py-1.5 text-center text-[9px] font-medium text-gray-400 uppercase tracking-wider border-r border-gray-200 bg-indigo-50/50"
                >
                  Buyer
                </th>
                {/* Option Count second level */}
                <th className="px-3 py-1.5 text-center text-[9px] font-medium text-gray-400 uppercase tracking-wider border-r border-gray-100 bg-green-50/50">
                  Historical
                </th>
                <th className="px-3 py-1.5 text-center text-[9px] font-medium text-gray-400 uppercase tracking-wider border-r border-gray-100 bg-green-50/50">
                  System
                </th>
                <th className="px-3 py-1.5 text-center text-[9px] font-medium text-gray-400 uppercase tracking-wider border-r border-gray-200 bg-green-50/50">
                  Buyer
                </th>
                {/* Total Quantity second level */}
                <th className="px-3 py-1.5 text-center text-[9px] font-medium text-gray-400 uppercase tracking-wider border-r border-gray-100 bg-amber-50/50">
                  Historical
                </th>
                <th className="px-3 py-1.5 text-center text-[9px] font-medium text-gray-400 uppercase tracking-wider border-r border-gray-100 bg-amber-50/50">
                  System
                </th>
                <th className="px-3 py-1.5 text-center text-[9px] font-medium text-gray-400 uppercase tracking-wider border-r border-gray-200 bg-amber-50/50">
                  Buyer
                </th>
              </tr>

              {/* Third Level Headers - Min/Max */}
              <tr className="border-b border-gray-200">
                {/* Price Point Min/Max */}
                <th className="px-2 py-1 text-center text-[9px] font-medium text-gray-400 uppercase tracking-wider border-r border-gray-50 bg-indigo-50/30">
                  Min
                </th>
                <th className="px-2 py-1 text-center text-[9px] font-medium text-gray-400 uppercase tracking-wider border-r border-gray-100 bg-indigo-50/30">
                  Max
                </th>
                <th className="px-2 py-1 text-center text-[9px] font-medium text-gray-400 uppercase tracking-wider border-r border-gray-50 bg-indigo-50/30">
                  Min
                </th>
                <th className="px-2 py-1 text-center text-[9px] font-medium text-gray-400 uppercase tracking-wider border-r border-gray-100 bg-indigo-50/30">
                  Max
                </th>
                <th className="px-2 py-1 text-center text-[9px] font-medium text-gray-400 uppercase tracking-wider border-r border-gray-50 bg-indigo-50/30">
                  Min
                </th>
                <th className="px-2 py-1 text-center text-[9px] font-medium text-gray-400 uppercase tracking-wider border-r border-gray-200 bg-indigo-50/30">
                  Max
                </th>
              </tr>
            </thead>

            <tbody>
              {bricks.map((brick) => {
                const isEditing = editingRows.has(brick.result_id);
                const isSaving = savingRows.has(brick.result_id);
                const currentEdit = editValues[brick.result_id];

                return (
                  <tr
                    key={brick.result_id}
                    className={cn(
                      "border-b border-gray-100 transition-colors",
                      isEditing ? "bg-indigo-50/30" : "hover:bg-gray-50",
                    )}
                  >
                    {/* Brick Name */}
                    <td
                      className={cn(
                        "sticky left-0 z-10 px-3 py-2.5 border-r border-gray-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]",
                        isEditing ? "bg-indigo-50/30" : "bg-white",
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{brick.brick_name}</span>
                        <span className="text-[10px] text-gray-400">{brick.brick_code}</span>
                      </div>
                    </td>

                    {/* Silhouette */}
                    <td className="px-3 py-2.5 text-xs text-gray-700 border-r border-gray-100">
                      {brick.silhouette || "—"}
                    </td>

                    {/* Fabric */}
                    <td className="px-3 py-2.5 text-xs text-gray-700 border-r border-gray-100">
                      {brick.fabric || "—"}
                    </td>

                    {/* Print */}
                    <td className="px-3 py-2.5 text-xs text-gray-700 border-r border-gray-100">{brick.print || "—"}</td>

                    {/* Buying Model */}
                    <td className="px-3 py-2.5 border-r border-gray-100">
                      <Badge variant="default" className="text-[10px]">
                        {brick.fashion_grade || "—"}
                      </Badge>
                    </td>

                    {/* Price Point - Historical Min */}
                    <td className="px-2 py-2.5 text-xs text-gray-700 text-center border-r border-gray-50 bg-indigo-50/20">
                      {brick.historical.price_min ?? 0}
                    </td>

                    {/* Price Point - Historical Max */}
                    <td className="px-2 py-2.5 text-xs text-gray-700 text-center border-r border-gray-100 bg-indigo-50/20">
                      {brick.historical.price_max ?? 0}
                    </td>

                    {/* Price Point - Suggested Min */}
                    <td className="px-2 py-2.5 text-xs text-gray-900 font-medium text-center border-r border-gray-50 bg-indigo-50/20">
                      {brick.system.price_min ?? 0}
                    </td>

                    {/* Price Point - Suggested Max */}
                    <td className="px-2 py-2.5 text-xs text-gray-900 font-medium text-center border-r border-gray-100 bg-indigo-50/20">
                      {brick.system.price_max ?? 0}
                    </td>

                    {/* Price Point - Buyer Min (editable) */}
                    <td className="px-2 py-2.5 text-xs text-center border-r border-gray-50 bg-indigo-50/20">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={currentEdit?.buyer_price_point_min ?? ""}
                          onChange={(e) =>
                            updateEditValue(brick.result_id, "buyer_price_point_min", parseFloat(e.target.value) || 0)
                          }
                          className="w-16 h-6 px-1 text-xs text-center"
                          placeholder="Min"
                        />
                      ) : (
                        <span
                          className={cn(
                            brick.buyer.price_min != null ? "text-primary-700 font-medium" : "text-gray-400",
                          )}
                        >
                          {brick.buyer.price_min ?? 0}
                        </span>
                      )}
                    </td>

                    {/* Price Point - Buyer Max (editable) */}
                    <td className="px-2 py-2.5 text-xs text-center border-r border-gray-200 bg-indigo-50/20">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={currentEdit?.buyer_price_point_max ?? ""}
                          onChange={(e) =>
                            updateEditValue(brick.result_id, "buyer_price_point_max", parseFloat(e.target.value) || 0)
                          }
                          className="w-16 h-6 px-1 text-xs text-center"
                          placeholder="Max"
                        />
                      ) : (
                        <span
                          className={cn(
                            brick.buyer.price_max != null ? "text-primary-700 font-medium" : "text-gray-400",
                          )}
                        >
                          {brick.buyer.price_max ?? 0}
                        </span>
                      )}
                    </td>

                    {/* Option Count - Historical */}
                    <td className="px-3 py-2.5 text-sm text-gray-700 text-center border-r border-gray-100 bg-green-50/20">
                      {brick.historical.options || 0}
                    </td>

                    {/* Option Count - System */}
                    <td className="px-3 py-2.5 text-sm text-gray-900 font-medium text-center border-r border-gray-100 bg-green-50/20">
                      {brick.system.options || 0}
                    </td>

                    {/* Option Count - Buyer (editable) */}
                    <td className="px-3 py-2.5 text-center border-r border-gray-200 bg-green-50/20">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={currentEdit?.buyer_options ?? ""}
                          onChange={(e) =>
                            updateEditValue(brick.result_id, "buyer_options", parseInt(e.target.value) || 0)
                          }
                          className="w-14 h-6 px-1 text-xs text-center mx-auto"
                        />
                      ) : (
                        <span
                          className={cn(
                            "text-sm font-medium",
                            brick.buyer.options != null ? "text-green-700" : "text-gray-400",
                          )}
                        >
                          {brick.buyer.options ?? "—"}
                        </span>
                      )}
                    </td>

                    {/* Total Quantity - Historical */}
                    <td className="px-3 py-2.5 text-sm text-gray-700 text-right border-r border-gray-100 bg-amber-50/20">
                      {brick.historical.qty?.toLocaleString() || 0}
                    </td>

                    {/* Total Quantity - System */}
                    <td className="px-3 py-2.5 text-sm text-gray-900 font-medium text-right border-r border-gray-100 bg-amber-50/20">
                      {brick.system.qty?.toLocaleString() || 0}
                    </td>

                    {/* Total Quantity - Buyer (editable) */}
                    <td className="px-3 py-2.5 text-right border-r border-gray-200 bg-amber-50/20">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={currentEdit?.buyer_qty ?? ""}
                          onChange={(e) => updateEditValue(brick.result_id, "buyer_qty", parseInt(e.target.value) || 0)}
                          className="w-20 h-6 px-1 text-xs text-right ml-auto"
                        />
                      ) : (
                        <span
                          className={cn(
                            "text-sm font-medium",
                            brick.buyer.qty != null ? "text-amber-700" : "text-gray-400",
                          )}
                        >
                          {brick.buyer.qty?.toLocaleString() ?? "—"}
                        </span>
                      )}
                    </td>

                    {/* Source */}
                    <td className="px-3 py-2.5 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleSave(brick.result_id)}
                            disabled={isSaving || !currentEdit?.buyer_options || !currentEdit?.buyer_qty}
                            className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed px-2 py-1 rounded"
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => handleCancel(brick.result_id)}
                            disabled={isSaving}
                            className="text-xs font-medium text-gray-600 hover:text-gray-800 disabled:text-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <Badge
                            variant={brick.dominant_source === "plano_buy_qty" ? "default" : "warning"}
                            className="text-[9px]"
                          >
                            {brick.dominant_source === "plano_buy_qty" ? "RA Pipeline" : brick.dominant_source}
                          </Badge>
                          {onSave && (
                            <button
                              onClick={() => handleEdit(brick)}
                              className="text-xs font-medium text-primary hover:text-primary-800"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer with totals - Fixed, does not scroll */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-gray-500">Total Combinations:</span>
              <span className="ml-2 font-semibold text-gray-900">{bricks.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <span className="text-gray-500">System Options:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {bricks.reduce((sum, b) => sum + (b.system.options || 0), 0)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Buyer Options:</span>
              <span className="ml-2 font-semibold text-primary-700">
                {bricks.reduce((sum, b) => sum + (b.buyer.options || 0), 0) || "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">System Quantity:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {bricks.reduce((sum, b) => sum + (b.system.qty || 0), 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Buyer Quantity:</span>
              <span className="ml-2 font-semibold text-amber-700">
                {bricks.reduce((sum, b) => sum + (b.buyer.qty || 0), 0).toLocaleString() || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
