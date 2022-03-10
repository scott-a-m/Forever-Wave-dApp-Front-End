import React from "react";
import "./App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMinus,
  faPlay,
  faPause,
  faSeedling,
  faSyncAlt,
  faEnvelope
} from "@fortawesome/free-solid-svg-icons";
import {
  faFreeCodeCamp,
  faGithub,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";


<div id="contact-block">
<h1>Contact</h1>
<a href="https://github.com/scott-a-m" target="_blank">
  <FontAwesomeIcon
    icon={faGithub}
    size="2x"
    border
    className="contact-icon"
  />
</a>
<a
  href="https://twitter.com/_scott_a_m"
  target="_blank"
  rel="noreferrrer"
>
  <FontAwesomeIcon
    icon={faTwitter}
    size="2x"
    border
    className="contact-icon"
  />
</a>
<a href="https://www.freecodecamp.org/scott-a-m" target="_blank">
  <FontAwesomeIcon
    icon={faFreeCodeCamp}
    size="2x"
    border
    className="contact-icon"
  />
</a>
<a href="#">
  <FontAwesomeIcon
    icon={faEnvelope}
    size="2x"
    border
    className="contact-icon"
  />
</a>
</div>