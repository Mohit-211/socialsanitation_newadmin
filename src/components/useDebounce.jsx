import { useEffect } from "react";

const useDebounce = (callback, delay, deps) => {
	useEffect(() => {
		const handler = setTimeout(() => {
			callback();
		}, delay);

		return () => clearTimeout(handler);
	}, deps);
};

export default useDebounce;