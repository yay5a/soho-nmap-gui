"use client";

export default function ToggleSwitch({ checked, onChange, disabled }) {
	function toggle() {
		if (disabled) return;
		onChange?.(!checked);
	}
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			onClick={toggle}
			disabled={disabled}
			className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
				checked ? "bg-emerald-500" : "bg-zinc-700"
			} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
		>
			<span
				className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
					checked ? "translate-x-5" : "translate-x-1"
				}`}
			/>
		</button>
	);
}
