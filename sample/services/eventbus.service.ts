interface Event<T> {
  type: string;
  payload: T;
}

type Listener<T> = (event: Event<T>) => void;

export class EventBus {
  private static instance: EventBus | null = null;
  private listeners: { [eventType: string]: Listener<any>[] } = {};

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  subscribe<T>(eventType: string, listener: Listener<T>) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(listener);
  }

  unsubscribe<T>(eventType: string, listener: Listener<T>) {
    const eventListeners = this.listeners[eventType];
    if (eventListeners) {
      this.listeners[eventType] = eventListeners.filter(l => l !== listener);
    }
  }

  emit<T>(eventType: string, payload: T) {
    const event: Event<T> = { type: eventType, payload };
    const eventListeners = this.listeners[eventType];
    if (eventListeners) {
      eventListeners.forEach(listener => listener(event));
    }
  }
}
