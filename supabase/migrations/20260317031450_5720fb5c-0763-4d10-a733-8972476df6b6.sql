
CREATE OR REPLACE FUNCTION public.queue_order_for_1c_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  -- При изменении статуса заказа → отправить в 1С
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.integration_queue (
      direction, entity_type, entity_id, payload, status
    ) VALUES (
      'to_1c',
      'order',
      NEW.id,
      jsonb_build_object(
        'order_id', NEW.id,
        'number', NEW.number,
        'status', NEW.status,
        'total_amount', NEW.total_amount,
        'paid_amount', NEW.paid_amount,
        'client_id', NEW.client_id,
        'changed_at', NEW.updated_at
      ),
      'pending'
    );
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.queue_order_for_1c_sync IS 'Заглушка: при изменении статуса заказа создаёт запись в очереди для синхронизации с 1С. Триггер подключается вручную когда интеграция будет готова.';
