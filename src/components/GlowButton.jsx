import styled from 'styled-components';

export function GlowButton({ children, type = 'button', disabled = false, onClick, fullWidth = false }) {
  return (
    <StyledWrapper $fullWidth={fullWidth}>
      <button type={type} disabled={disabled} onClick={onClick}>
        {children}
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: ${({ $fullWidth }) => ($fullWidth ? 'block' : 'inline-block')};
  max-width: 100%;
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};

  button {
    --glow-color: rgb(93, 255, 126);
    --glow-spread-color: rgba(22, 255, 81, 0.68);
    --enhanced-glow-color: rgb(190, 255, 203);
    --btn-color: rgb(0, 76, 24);
    --btn-gradient: linear-gradient(135deg, rgb(0, 140, 48), rgb(0, 66, 23));
    --hover-gradient: linear-gradient(135deg, rgb(164, 255, 182), rgb(65, 225, 104));
    background: var(--btn-gradient);
    border: 0.25em solid var(--glow-color);
    border-radius: 1em;
    box-shadow:
      0 0 1em 0.25em var(--glow-color),
      0 0 4em 1em var(--glow-spread-color),
      inset 0 0 0.75em 0.25em var(--glow-color);
    color: rgb(255, 255, 255);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: var(--text-button);
    font-weight: bold;
    letter-spacing: 0.02em;
    min-height: 3.75rem;
    outline: none;
    padding: 1em 3em;
    position: relative;
    text-shadow: 0 0 0.5em var(--glow-color);
    transition: all 0.3s;
    width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  }

  button::after {
    pointer-events: none;
    content: '';
    position: absolute;
    top: 120%;
    left: 0;
    height: 100%;
    width: 100%;
    background-color: var(--glow-spread-color);
    filter: blur(2em);
    opacity: 0.7;
    transform: perspective(1.5em) rotateX(35deg) scale(1, 0.6);
  }

  button:hover:not(:disabled) {
    color: rgb(255, 255, 255);
    background: var(--hover-gradient);
    box-shadow:
      0 0 1em 0.25em var(--glow-color),
      0 0 4em 2em var(--glow-spread-color),
      inset 0 0 0.75em 0.25em var(--glow-color);
  }

  button:active:not(:disabled) {
    box-shadow:
      0 0 0.6em 0.25em var(--glow-color),
      0 0 2.5em 2em var(--glow-spread-color),
      inset 0 0 0.5em 0.25em var(--glow-color);
  }

  button:focus-visible {
    outline: 3px solid var(--color-gold-light);
    outline-offset: 5px;
  }

  button:disabled {
    cursor: wait;
    opacity: 0.6;
  }

  @media (max-width: 39.99rem) {
    display: block;
    width: 100%;

    button {
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    button {
      transition: none;
    }

    button:hover:not(:disabled),
    button:active:not(:disabled) {
      transition: none;
    }
  }
`;
