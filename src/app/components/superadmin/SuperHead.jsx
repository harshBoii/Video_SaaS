"use client";

import React, { useEffect, useState } from "react";
import styles from "./SuperHead.module.css";


const SuperHead = () => {
  const [authData, setAuthData] = useState(null);

  const avatarUrl = `https://placehold.co/40x40/7E57C2/FFFFFF?text=Adm`;

  return (
    <header className={styles.header}>
      <div className={styles.userSection}>
        <div className={styles.userProfile}>
          {/* <Image
            src={avatarUrl}
            width={30}
            height={30}
            className={styles.avatar}
            unoptimized={true}
            alt="Admin Avatar"
          /> */}
        </div>
      </div>
    </header>
  );
};

export default SuperHead;
