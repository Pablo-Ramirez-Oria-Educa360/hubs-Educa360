import React from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
import { faUserCircle } from "@fortawesome/free-solid-svg-icons/faUserCircle";
import styles from "./Header.scss";
import { Container } from "./Container";
import { SocialBar } from "../home/SocialBar";
import { SignInButton } from "../home/SignInButton";
import { AppLogo } from "../misc/AppLogo";
import { Button } from "../input/Button";

export function Header({ enableSpoke, editorName, isAdmin, isSignedIn, email, onSignOut, isHmc }) {
  return (
    <header>
      <Container as="div" className={styles.container}>
        <nav>
          <ul>
            <li>
              <a href="/" className={styles.homeLink}>
                <AppLogo />
              </a>
            </li>
            {enableSpoke && (
              <li>
                <a href="/spoke">{editorName}</a>
              </li>
            )}
            <li>
              <a href="https://educa360.com/" target="_blank" rel="noopener noreferrer">
                <FormattedMessage id="header.explore" defaultMessage="Explore" />
              </a>
            </li>
            <li>
              <a href="https://educa360.com/precios/" target="_blank" rel="noopener noreferrer">
                <FormattedMessage id="header.plans" defaultMessage="Plans" />
              </a>
            </li>
            <li>
              <a
                href="https://content.app-sources.com/s/90759658313721701/uploads/tutoriales/Manual_Educa360_v2-6411442.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FormattedMessage id="header.resources" defaultMessage="Resources" />
              </a>
            </li>
            {isAdmin && (
              <li>
                <a href="/admin" rel="noreferrer noopener">
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
        <div className={styles.signIn}>
          {isSignedIn ? (
            <div className={styles.signedIn}>
              {email && (
                <span className={styles.signedInLabel}>
                  <FormattedMessage
                    id="more-menu.you-signed-in-as"
                    defaultMessage="Signed in as: {email}"
                    values={{ email }}
                  />
                </span>
              )}
              <Button preset="signin" thick as="a" href="#" onClick={onSignOut} className={styles.signOutButton}>
                <FontAwesomeIcon icon={faUserCircle} className={styles.signOutIcon} />
                <FormattedMessage id="header.sign-out" defaultMessage="Sign Out" />
              </Button>
            </div>
          ) : (
            <SignInButton />
          )}
        </div>
        {isHmc ? <SocialBar mobile /> : null}
      </Container>
    </header>
  );
}

Header.propTypes = {
  enableSpoke: PropTypes.bool,
  editorName: PropTypes.string,
  isAdmin: PropTypes.bool,
  isSignedIn: PropTypes.bool,
  email: PropTypes.string,
  onSignOut: PropTypes.func,
  isHmc: PropTypes.bool
};
