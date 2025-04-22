import { Mutex } from "async-mutex";

const mutexMap = new Map<string, Mutex>();

const mutexStore: Record<string, Mutex> = {}

export const mutex = new Proxy(mutexStore, {
    get(_, prop) {
        // if doesn't exist, create a new mutex, else return the existing one
        if (!mutexMap.has(prop as string)) {
            const mutex = new Mutex();
            mutexMap.set(prop as string, mutex);
            return mutex;
        }
        return mutexMap.get(prop as string);
    },
});

export default mutex;