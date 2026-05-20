import { createContext, useContext, useState, useCallback } from "react";
import type { CurrentUser } from "@/types/user.type";

interface AuthContextType {
	user: CurrentUser | null;
	isLoading: boolean;
	hasPermission: (permission: string) => boolean;
	hasAnyPermission: (permissions: string[]) => boolean;
	setCurrentUser: (user: CurrentUser | null) => void;
	setIsLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<CurrentUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const hasPermission = useCallback(
		(permission: string): boolean => {
			if (!user) return false;
			return user.permissions.includes(permission);
		},
		[user],
	);

	const hasAnyPermission = useCallback(
		(permissions: string[]): boolean => {
			if (!user) return false;
			return permissions.some((p) => user.permissions.includes(p));
		},
		[user],
	);

	const setCurrentUser = useCallback((u: CurrentUser | null) => {
		setUser(u);
	}, []);

	return (
		<AuthContext.Provider
			value={{
				user,
				isLoading,
				hasPermission,
				hasAnyPermission,
				setCurrentUser,
				setIsLoading,
			}}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextType {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth must be used inside <AuthProvider>");
	}
	return ctx;
}
