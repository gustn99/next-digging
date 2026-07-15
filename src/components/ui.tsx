import React from 'react';

// Shadcn UI 스타일의 Button 컴포넌트
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'default' | 'outline' | 'ghost';
	size?: 'default' | 'sm' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({className, variant = 'default', size = 'default', ...props}, ref) => {
	const variants: Record<string, string> = {
		default: 'bg-zinc-900 text-white hover:bg-zinc-800',
		outline: 'border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900',
		ghost: 'hover:bg-zinc-100 text-zinc-700',
	};
	const sizes: Record<string, string> = {
		default: 'h-10 px-4 py-2',
		sm: 'h-9 rounded-md px-3',
		icon: 'h-10 w-10',
	};

	return (
		<button
			ref={ref}
			className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className || ''}`}
			{...props}
		/>
	);
});
Button.displayName = 'Button';

// Shadcn UI 스타일의 Input 컴포넌트
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({className, type, ...props}, ref) => {
	return (
		<input
			type={type}
			className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
			ref={ref}
			{...props}
		/>
	);
});
Input.displayName = 'Input';

// Shadcn UI 스타일의 Badge 컴포넌트
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: 'default' | 'secondary' | 'outline';
}

export const Badge = ({className, variant = 'default', ...props}: BadgeProps) => {
	const variants: Record<string, string> = {
		default: 'border-transparent bg-zinc-900 text-white hover:bg-zinc-800',
		secondary: 'border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80',
		outline: 'text-zinc-950',
	};

	return (
		<div className={`inline-flex items-center rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 ${variants[variant]} ${className || ''}`} {...props} />
	);
};
