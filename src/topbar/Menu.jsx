import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

// A pill button that opens a small menu, and the items in it

// A pill button that opens a small menu below it
export function MenuButton({
  label,
  title,
  caret = true,
  className = "",
  menuClassName = "",
  centered = false,
  children,
}) {
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [position, setPosition] = useState(null);
  const close = () => setPosition(null);

  const toggle = () => {
    if (position) return close();
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom + 8, left: rect.left });
  };

  // Once the menu has a width, centre it in the window or pull it back inside the right edge
  useLayoutEffect(() => {
    if (!position) return;
    const width = menuRef.current.offsetWidth;
    const left = centered
      ? Math.max(8, (window.innerWidth - width) / 2)
      : Math.max(8, Math.min(position.left, window.innerWidth - width - 8));
    if (left !== position.left) setPosition({ ...position, left });
  }, [position, centered]);

  useEffect(() => {
    if (!position) return;
    // A press outside only closes the menu: it never reaches the page underneath
    const swallow = (e) => {
      e.stopPropagation();
      e.preventDefault();
    };
    const handlePointerDown = (e) => {
      if (
        menuRef.current?.contains(e.target) ||
        buttonRef.current.contains(e.target)
      )
        return;
      e.stopPropagation();
      window.addEventListener("click", swallow, { capture: true, once: true });
      window.addEventListener(
        "pointerup",
        () =>
          setTimeout(() =>
            window.removeEventListener("click", swallow, { capture: true })
          ),
        { capture: true, once: true }
      );
      close();
    };
    // Captured first, so Esc closes the menu without also leaving Focus
    const handleKeyDown = (e) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      close();
      buttonRef.current.focus();
    };
    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [position]);

  useEffect(() => {
    if (position) menuRef.current?.querySelector("button")?.focus();
  }, [position]);

  return (
    <>
      <button
        ref={buttonRef}
        className={`chip ${className}`}
        title={title}
        aria-haspopup="menu"
        aria-expanded={Boolean(position)}
        onClick={toggle}
      >
        {label}
        {caret && (
          <span className="chip__caret">
            <ChevronDown />
          </span>
        )}
      </button>
      {position &&
        createPortal(
          <div
            ref={menuRef}
            className={`menu ${menuClassName}`}
            role="menu"
            style={{
              ...position,
              maxHeight: `calc(100vh - ${position.top + 12}px)`,
            }}
          >
            {children(close)}
          </div>,
          document.body
        )}
    </>
  );
}

export function MenuItem({
  checked,
  hint,
  description,
  onSelect,
  close,
  children,
}) {
  return (
    <button
      role={checked === undefined ? "menuitem" : "menuitemradio"}
      aria-checked={checked}
      className="menu__item"
      onClick={() => {
        onSelect();
        close();
      }}
    >
      <span className="menu__check">{checked && <Check />}</span>
      {description ? (
        <span className="menu__text">
          {children}
          <span className="menu__description">{description}</span>
        </span>
      ) : (
        children
      )}
      {hint && <span className="menu__hint">{hint}</span>}
    </button>
  );
}

export function OptionMenu({ title, options, value, onChange, label }) {
  return (
    <MenuButton label={label} title={title}>
      {(close) => (
        <>
          <div className="menu__title">{title}</div>
          {options.map((option) => (
            <MenuItem
              key={option.id}
              checked={option.id === value}
              onSelect={() => onChange(option.id)}
              close={close}
            >
              {option.label}
            </MenuItem>
          ))}
        </>
      )}
    </MenuButton>
  );
}
