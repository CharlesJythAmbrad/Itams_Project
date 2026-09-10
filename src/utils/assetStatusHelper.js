import { supabase } from "@/lib/supabaseClient"

/**
 * Determines and restores the appropriate status of an asset based on its current active assignments or borrowings.
 * If active borrowing exists -> returns "allocated"
 * If active assignment exists -> returns "deployed"
 * Otherwise -> returns "in_stock"
 * 
 * @param {string} assetId
 * @returns {Promise<string>} The new status
 */
export async function restoreAssetStatus(assetId) {
  if (!assetId) return "in_stock"

  try {
    // 1. Check active borrowing
    const { data: borrowingData, error: borrowErr } = await supabase
      .from("asset_borrowing")
      .select("id")
      .eq("asset_id", assetId)
      .eq("status", "active")
      .limit(1)

    if (!borrowErr && borrowingData && borrowingData.length > 0) {
      await supabase
        .from("assets")
        .update({ status: "allocated" })
        .eq("id", assetId)
      return "allocated"
    }

    // 2. Check active assignment
    const { data: assignmentData, error: assignErr } = await supabase
      .from("asset_assignments")
      .select("id")
      .eq("asset_id", assetId)
      .eq("status", "active")
      .limit(1)

    if (!assignErr && assignmentData && assignmentData.length > 0) {
      await supabase
        .from("assets")
        .update({ status: "deployed" })
        .eq("id", assetId)
      return "deployed"
    }

    // 3. Otherwise default to in_stock
    await supabase
      .from("assets")
      .update({ status: "in_stock" })
      .eq("id", assetId)
    return "in_stock"
  } catch (err) {
    console.error("Error restoring asset status:", err)
    return "in_stock"
  }
}
