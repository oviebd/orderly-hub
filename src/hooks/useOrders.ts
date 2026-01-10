import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Order, OrderStatus, OrderSource } from '@/types';

export function useOrders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(order => ({
        id: order.id,
        ownerId: order.owner_id,
        customerId: order.customer_id || '',
        phone: order.phone,
        customerName: order.customer_name,
        productDetails: order.product_details,
        price: Number(order.price),
        deliveryDate: new Date(order.delivery_date),
        status: order.status as OrderStatus,
        source: order.source as OrderSource,
        notes: order.notes,
        createdAt: new Date(order.created_at),
      })) as Order[];
    },
    enabled: !!user,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (order: Omit<Order, 'id' | 'createdAt'>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .insert({
          owner_id: user.id,
          customer_id: order.customerId || null,
          phone: order.phone,
          customer_name: order.customerName,
          product_details: order.productDetails,
          price: order.price,
          delivery_date: order.deliveryDate.toISOString(),
          status: order.status,
          source: order.source,
          notes: order.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
    },
  });

  return {
    orders: ordersQuery.data ?? [],
    isLoading: ordersQuery.isLoading,
    error: ordersQuery.error,
    createOrder: createOrderMutation.mutateAsync,
    updateOrderStatus: updateOrderStatusMutation.mutateAsync,
    isCreating: createOrderMutation.isPending,
    isUpdating: updateOrderStatusMutation.isPending,
  };
}
