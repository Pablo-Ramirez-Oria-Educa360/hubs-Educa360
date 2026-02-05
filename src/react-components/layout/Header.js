import React from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
import { faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons/faArrowRightFromBracket";
import { faUserCircle } from "@fortawesome/free-solid-svg-icons/faUserCircle";
import styles from "./Header.scss";
import { Container } from "./Container";
import { SignInButton } from "../home/SignInButton";
import { AppLogo } from "../misc/AppLogo";
import { Button } from "../input/Button";
import maskEmail from "../../utils/mask-email";

export function Header({ enableSpoke, editorName, isAdmin, isSignedIn, email, onSignOut, onOpenAvatarMaker }) {
  const maskedEmail = maskEmail(email);
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
            <li>
              <a
                href="https://avatar-maker.educa360.es"
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => {
                  e.preventDefault();
                  if (onOpenAvatarMaker) onOpenAvatarMaker();
                }}
              >
                <FormattedMessage id="header.avatar-maker" defaultMessage="Avatar Maker" />
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
              <Button preset="signin" thick as="a" href="#" onClick={onSignOut} className={styles.signOutButton}>
                {maskedEmail ? (
                  <>
                    <FontAwesomeIcon icon={faUserCircle} className={styles.signOutIcon} />
                    <span className={styles.signOutLabel}>{maskedEmail}</span>
                    <FontAwesomeIcon icon={faArrowRightFromBracket} className={styles.signOutIcon} />
                  </>
                ) : (
                  <FormattedMessage id="header.sign-out" defaultMessage="Sign Out" />
                )}
              </Button>
            </div>
          ) : (
            <SignInButton />
          )}
        </div>
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
  onOpenAvatarMaker: PropTypes.func
};
