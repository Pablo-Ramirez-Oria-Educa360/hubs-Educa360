import React, { useState } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import styles from "./Header.scss";
import { ReactComponent as Hamburger } from "../icons/Hamburger.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
export function MobileNav({ enableSpoke, editorName, isAdmin }) {
  const [navOpen, setNav] = useState(false);
  const toggleNav = () => {
    setNav(!navOpen);
  };
  return (
    <>
      <div className={styles.navContainer}>
        <div className={styles.mobileNavWrapper}>
          <Hamburger onClick={toggleNav} />
          <header className={`${navOpen ? "is-active" : "hide"}`}>
            <nav role="navigation">
              <ul>
                {enableSpoke && (
                  <li>
                    <a href="/spoke">{editorName}</a>
                  </li>
                )}
                <li>
                  <a href="https://educa360.com/">
                    <FormattedMessage id="header.explore" defaultMessage="Explore" />
                  </a>
                </li>
                <li>
                  <a href="https://educa360.com/precios/">
                    <FormattedMessage id="header.plans" defaultMessage="Plans" />
                  </a>
                </li>
                <li>
                  <a href="https://educa360.com/kitdeimplatacionvr/">
                    <FormattedMessage id="header.resources" defaultMessage="Resources" />
                  </a>
                </li>
                {isAdmin && (
                  <li>
                    <a style={{ marginLeft: 0 }} href="/admin" rel="noreferrer noopener">
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
          </header>
        </div>
      </div>
    </>
  );
}

MobileNav.propTypes = {
  enableSpoke: PropTypes.bool,
  editorName: PropTypes.string,
  isAdmin: PropTypes.bool
};
