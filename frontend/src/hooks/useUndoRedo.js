import { useState, useCallback } from 'react';

const useUndoRedo = (initialState) => {
    const [past, setPast] = useState([]);
    const [present, setPresent] = useState(initialState);
    const [future, setFuture] = useState([]);

    const canUndo = past.length > 0;
    const canRedo = future.length > 0;

    const undo = useCallback(() => {
        if (!canUndo) return;

        const newPresent = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);

        setFuture([present, ...future]);
        setPresent(newPresent);
        setPast(newPast);
    }, [past, present, future, canUndo]);

    const redo = useCallback(() => {
        if (!canRedo) return;

        const newPresent = future[0];
        const newFuture = future.slice(1);

        setPast([...past, present]);
        setPresent(newPresent);
        setFuture(newFuture);
    }, [past, present, future, canRedo]);

    const set = useCallback((newPresent, addToHistory = true) => {
        if (addToHistory) {
            setPast(prev => [...prev, present]);
        }
        setPresent(newPresent);
        if (addToHistory) {
            setFuture([]); // Clear future on new change
        }
    }, [present]);

    const reset = useCallback((newState) => {
        setPast([]);
        setPresent(newState);
        setFuture([]);
    }, []);

    return {
        state: present,
        set,
        undo,
        redo,
        canUndo,
        canRedo,
        reset
    };
};

export default useUndoRedo;
