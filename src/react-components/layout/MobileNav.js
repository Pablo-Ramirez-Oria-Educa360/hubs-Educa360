import React, { useState } from "react";
import PropTypes from "prop-types";
import { FormattedMessage, useIntl } from "react-intl";
import styles from "./Header.scss";
import { ReactComponent as Hamburger } from "../icons/Hamburger.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
import { SignInButton } from "../home/SignInButton";
import { Button } from "../input/Button";
import maskEmail from "../../utils/mask-email";
import { AppLogo } from "../misc/AppLogo";

export function MobileNav({ enableSpoke, editorName, isAdmin, isSignedIn, email, onSignOut }) {
  const [navOpen, setNav] = useState(false);
  const toggleNav = () => setNav(!navOpen);
  const closeNav = () => setNav(false);
  const maskedEmail = maskEmail(email);
  const intl = useIntl();
  const toggleLabel = intl.formatMessage({
    id: "mobile-nav.toggle-menu",
    defaultMessage: "Toggle menu"
  });

  return (
    <div className={styles.navContainer}>
      <button className={styles.hamburgerButton} onClick={toggleNav} aria-label={toggleLabel} aria-expanded={navOpen}>
        <Hamburger />
      </button>
      <div
        className={navOpen ? styles.mobileOverlayVisible : styles.mobileOverlay}
        onClick={closeNav}
        role="presentation"
      />
      <aside className={`${styles.mobilePanel} ${navOpen ? styles.mobilePanelOpen : ""}`} aria-hidden={!navOpen}>
        <div className={styles.mobilePanelLogo}>
          <a href="/" onClick={closeNav}>
            <AppLogo />
          </a>
        </div>
        <nav role="navigation">
          <ul>
            {enableSpoke && (
              <li>
                <a href="/spoke" onClick={closeNav}>
                  {editorName}
                </a>
              </li>
            )}
            <li>
              <a href="https://educa360.com/" onClick={closeNav}>
                <FormattedMessage id="header.explore" defaultMessage="Explore" />
              </a>
            </li>
            <li>
              <a href="https://educa360.com/precios/" onClick={closeNav}>
                <FormattedMessage id="header.plans" defaultMessage="Plans" />
              </a>
            </li>
            <li>
              <a href="https://educa360.com/kitdeimplatacionvr/" onClick={closeNav}>
                <FormattedMessage id="header.resources" defaultMessage="Resources" />
              </a>
            </li>
            {isAdmin && (
              <li>
                <a href="/admin" rel="noreferrer noopener" onClick={closeNav}>
                  <i>
                    <FontAwesomeIcon icon={faCog} />
                  </i>
                  &nbsp;
                  <FormattedMessage id="header.admin" defaultMessage="Admin" />
                </a>
              </li>
            )}
          </ul>
        </nav>
        <div className={styles.mobilePanelActions}>
          {isSignedIn ? (
            <Button
              preset="signin"
              thick
              as="a"
              href="#"
              onClick={e => {
                e.preventDefault();
                onSignOut?.(e);
                closeNav();
              }}
            >
              {maskedEmail || <FormattedMessage id="header.sign-out" defaultMessage="Sign Out" />}
            </Button>
          ) : (
            <SignInButton />
          )}
        </div>
      </aside>
    </div>
  );
}

MobileNav.propTypes = {
  enableSpoke: PropTypes.bool,
  editorName: PropTypes.string,
  isAdmin: PropTypes.bool,
  isSignedIn: PropTypes.bool,
  email: PropTypes.string,
  onSignOut: PropTypes.func
};
