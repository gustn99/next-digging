import { useState, useEffect } from 'react';
import { Store } from './types';

export function useStores() {
	const [stores, setStores] = useState<Store[]>([]);
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsMounted(true);
		const savedStores = localStorage.getItem('digging_stores');
		if (savedStores) {
			try {
				setStores(JSON.parse(savedStores));
			} catch (e) {
				console.error('Failed to parse stores from local storage', e);
			}
		}
	}, []);

	const saveStores = (newStores: Store[]) => {
		setStores(newStores);
		localStorage.setItem('digging_stores', JSON.stringify(newStores));
	};

	return { stores, saveStores, isMounted };
}
