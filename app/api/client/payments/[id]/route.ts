import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic'

/**
 * PUT /api/client/payments/[id]
 * Update a payment method (e.g., set as default)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const paymentMethodId = parseInt(params.id);
    if (isNaN(paymentMethodId)) {
      return NextResponse.json(
        { error: 'Invalid payment method ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Build update data
    const updateData: Record<string, any> = {};

    if (body.is_default !== undefined) updateData.is_default = body.is_default;
    if (body.billing_address_line1 !== undefined) updateData.billing_address_line1 = body.billing_address_line1;
    if (body.billing_address_line2 !== undefined) updateData.billing_address_line2 = body.billing_address_line2;
    if (body.billing_city !== undefined) updateData.billing_city = body.billing_city;
    if (body.billing_postal_code !== undefined) updateData.billing_postal_code = body.billing_postal_code;
    if (body.billing_country !== undefined) updateData.billing_country = body.billing_country;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update payment method
    const { data: paymentMethod, error: updateError } = await supabase
      .from('client_payment_methods')
      .update(updateData)
      .eq('id', paymentMethodId)
      .eq('client_id', user.id)
      .eq('is_active', true)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment method:', updateError);
      return NextResponse.json(
        { error: 'Failed to update payment method' },
        { status: 500 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Payment method updated successfully',
      payment_method: paymentMethod,
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/client/payments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/client/payments/[id]
 * Delete (soft delete) a payment method
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const paymentMethodId = parseInt(params.id);
    if (isNaN(paymentMethodId)) {
      return NextResponse.json(
        { error: 'Invalid payment method ID' },
        { status: 400 }
      );
    }

    // Check if this is the default payment method
    const { data: paymentMethod } = await supabase
      .from('client_payment_methods')
      .select('is_default')
      .eq('id', paymentMethodId)
      .eq('client_id', user.id)
      .eq('is_active', true)
      .single();

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // If this is the default, check if there are other payment methods
    if (paymentMethod.is_default) {
      const { count } = await supabase
        .from('client_payment_methods')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', user.id)
        .eq('is_active', true);

      if ((count || 0) > 1) {
        return NextResponse.json(
          { error: 'Cannot delete default payment method. Please set another payment method as default first.' },
          { status: 400 }
        );
      }
    }

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase
      .from('client_payment_methods')
      .update({ is_active: false })
      .eq('id', paymentMethodId)
      .eq('client_id', user.id);

    if (deleteError) {
      console.error('Error deleting payment method:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete payment method' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Payment method deleted successfully',
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/client/payments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
