const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getReviewByReviewId = async (client, reviewId) => {
  const { rows } = await client.query(
    `
        SELECT *
        FROM review r
        WHERE r.id = $1
        `,
    [reviewId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getLikeCountByReviewId = async (client, reviewId) => {
  const { rows } = await client.query(
    `
        SELECT r.like_count
        FROM review r
        WHERE r.id = $1
        `,
    [reviewId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getScrapCountByReviewId = async (client, reviewId) => {
  const { rows } = await client.query(
    `
        SELECT r.scrap_count
        FROM review r
        WHERE r.id = $1
        `,
    [reviewId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getCurrentLikeStatusByReviewIdAndUserId = async (client, reviewId, userId) => {
  const { rows } = await client.query(
    `
          SELECT rl.is_deleted
          FROM review_like rl
          WHERE rl.review_id = $1
            AND rl.user_id = $2
          `,
    [reviewId, userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getCurrentScrapStatusByReviewIdAndUserId = async (client, reviewId, userId) => {
  const { rows } = await client.query(
    `
            SELECT rc.is_deleted
            FROM review_scrap rc
            WHERE rc.review_id = $1
              AND rc.user_id = $2
            `,
    [reviewId, userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const postReviewLikeByReviewId = async (client, userId, reviewId, isLiked) => {
  const isDeleted = !isLiked;
  const { rows: existingRows } = await client.query(
    `
          SELECT *
          FROM review_like rl
          WHERE rl.user_id = $1
              AND rl.review_id = $2
          `,
    [userId, reviewId],
  );
  if (existingRows.length === 0) {
    console.log('>>> making new');
    const { rows } = await client.query(
      `
        INSERT INTO review_like
        (user_id, review_id, is_deleted)
        VALUES
        ($1, $2, $3)
        RETURNING is_deleted
        `,
      [userId, reviewId, isDeleted],
    );
    console.log(rows);
    return convertSnakeToCamel.keysToCamel(rows);
  } else {
    console.log('>>> updating');
    const { rows } = await client.query(
      `
        UPDATE review_like
        SET is_deleted = $3
        WHERE user_id = $1
            AND review_id = $2
        RETURNING is_deleted
        `,
      [userId, reviewId, isDeleted],
    );
    console.log(rows);
    return convertSnakeToCamel.keysToCamel(rows);
  }
};

const postReviewScrapByReviewId = async (client, userId, reviewId, isScraped) => {
  const isDeleted = !isScraped;
  const { rows: existingRows } = await client.query(
    `
            SELECT *
            FROM review_scrap rs
            WHERE rs.user_id = $1
                AND rs.review_id = $2
            `,
    [userId, reviewId],
  );
  if (existingRows.length === 0) {
    console.log('>>> making new');
    const { rows } = await client.query(
      `
          INSERT INTO review_scrap
          (user_id, review_id, is_deleted)
          VALUES
          ($1, $2, $3)
          RETURNING is_deleted
          `,
      [userId, reviewId, isDeleted],
    );
    console.log(rows);
    return convertSnakeToCamel.keysToCamel(rows);
  } else {
    console.log('>>> updating');
    const { rows } = await client.query(
      `
          UPDATE review_scrap
          SET is_deleted = $3
          WHERE user_id = $1
              AND review_id = $2
          RETURNING is_deleted
          `,
      [userId, reviewId, isDeleted],
    );
    console.log(rows);
    return convertSnakeToCamel.keysToCamel(rows);
  }
};

const updateReviewLikeCount = async (client, reviewId, likeCount) => {
  const { rows } = await client.query(
    `
        UPDATE review
        SET like_count = $1
        WHERE  id = $2
        RETURNING like_count
          `,
    [likeCount, reviewId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getReviewByShopIdOrderByLike = async (client, shopId, limit, offset) => {
  const { rows } = await client.query(
    `
    SELECT  r.id AS review_id, r.shop_id, ri.image, u.image AS writer_thumbnail, u.nickname AS writer_name, r.like_count, r.scrap_count, r.content
    FROM (SELECT r.id, r.shop_id, r.user_id, r.content, r.like_count, r.scrap_count
        FROM review r
        WHERE r.shop_id = $1
        AND r.is_deleted = FALSE) AS r
    INNER JOIN "user" u
    ON r.user_id = u.id
    INNER JOIN (SELECT ri.image, ri.review_id
        FROM review_image ri
        WHERE ri.is_preview = TRUE
        AND ri.is_deleted = FALSE) AS ri
    ON r.id = ri.review_id
    
    ORDER BY r.like_count DESC, r.scrap_count DESC , r.id
    LIMIT $2
    OFFSET $3
        `,
    [shopId, limit, offset],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};
const updateReviewScrapCount = async (client, reviewId, scrapCount) => {
  const { rows } = await client.query(
    `
          UPDATE review
          SET scrap_count = $1
          WHERE  id = $2
          RETURNING scrap_count
            `,
    [scrapCount, reviewId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};
const getReviewScrapByUserId = async (client, reviewId, userId) => {
  const { rows } = await client.query(
    `
              SELECT id
              FROM review_scrap rs
              WHERE rs.review_id = $1
                AND rs.user_id = $2
                AND rs.is_deleted = FALSE
              `,
    [reviewId, userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getReviewByShopIdOrderByScrap = async (client, shopId, limit, offset) => {
  const { rows } = await client.query(
    `
    SELECT  r.id AS review_id, r.shop_id, ri.image, u.image AS writer_thumbnail, u.nickname AS writer_name, r.like_count, r.scrap_count, r.content
    FROM (SELECT r.id, r.shop_id, r.user_id, r.content, r.like_count, r.scrap_count
        FROM review r
        WHERE r.shop_id = $1
        AND r.is_deleted = FALSE) AS r
    INNER JOIN "user" u
    ON r.user_id = u.id
    INNER JOIN (SELECT ri.image, ri.review_id
        FROM review_image ri
        WHERE ri.is_preview = TRUE
        AND ri.is_deleted = FALSE) AS ri
    ON r.id = ri.review_id
    
    ORDER BY r.scrap_count DESC, r.like_count DESC , r.id
    LIMIT $2
    OFFSET $3
          `,
    [shopId, limit, offset],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getReviewByShopIdOrderByRecent = async (client, shopId, limit, offset) => {
  const { rows } = await client.query(
    `
    SELECT  r.id AS review_id, r.shop_id, ri.image, u.image AS writer_thumbnail, u.nickname AS writer_name, r.like_count, r.scrap_count, r.content
    FROM (SELECT r.id, r.shop_id, r.user_id, r.content, r.like_count, r.scrap_count, r.created_at
        FROM review r
        WHERE r.shop_id = $1
        AND r.is_deleted = FALSE) AS r
    INNER JOIN "user" u
    ON r.user_id = u.id
    INNER JOIN (SELECT ri.image, ri.review_id
        FROM review_image ri
        WHERE ri.is_preview = TRUE
        AND ri.is_deleted = FALSE) AS ri
    ON r.id = ri.review_id
    
    ORDER BY r.created_at , r.scrap_count DESC , r.id
    LIMIT $2
    OFFSET $3
          `,
    [shopId, limit, offset],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getReviewLikeByUserId = async (client, reviewId, userId) => {
  const { rows } = await client.query(
    `
              SELECT rl.review_id
              FROM review_like rl
              WHERE rl.review_id = $1
                AND rl.user_id = $2
                AND rl.is_deleted = FALSE
              `,
    [reviewId, userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getReviewWriterByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT u.nickname as writer_name, u.image as writer_thumbnail
    FROM "user" u
    WHERE u.id = $1
    AND u.is_deleted = FALSE
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getReviewImagesByReviewId = async (client, reviewId) => {
  const { rows } = await client.query(
    `
    SELECT ri.image
    FROM review_image ri
    WHERE ri.review_id = $1
    AND ri.is_deleted = FALSE
    `,
    [reviewId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getReviewItemByReviewId = async (client, reviewId) => {
  const { rows } = await client.query(
    `
    SELECT rtm.item_name, rtm.price
    FROM review_item rtm
    WHERE rtm.review_id = $1
    AND rtm.is_deleted = FALSE
    `,
    [reviewId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getReviewTagByReviewId = async (client, reviewId) => {
  const { rows } = await client.query(
    `
    SELECT t.name
    FROM review_tag rt
    INNER JOIN tag t
    ON rt.tag_id = t.id
    WHERE rt.review_id = $1
    AND rt.is_deleted = FALSE
    `,
    [reviewId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};



const getReviewOrderByRecent = async (client) => {
  const { rows } = await client.query(
    `
    SELECT r.id AS review_id, r.shop_id, s.shop_name, ri.image, u.image AS writer_thumbnail, u.nickname AS writer_name, r.like_count, r.scrap_count, r.content, c.name as category
    FROM review r
    INNER JOIN review_image ri
    ON r.id = ri.review_id
    INNER JOIN shop s
    on s.id = r.shop_id
    INNER JOIN shop_category sc
    ON s.id = sc.shop_id
    INNER JOIN category c
    ON sc.category_id = c.id
    INNER JOIN "user" u
    ON u.id = r.user_id
    WHERE ri.is_preview = TRUE
    ORDER BY r.created_at DESC
    limit 15
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  getReviewByReviewId,
  getLikeCountByReviewId,
  getCurrentLikeStatusByReviewIdAndUserId,
  postReviewLikeByReviewId,
  updateReviewLikeCount,
  getReviewScrapByUserId,
  getReviewLikeByUserId,
  getReviewWriterByUserId,
  getReviewImagesByReviewId,
  getReviewItemByReviewId,
  getReviewTagByReviewId,
  getReviewByShopIdOrderByLike,
  getReviewByShopIdOrderByScrap,
  getReviewByShopIdOrderByRecent,
  getScrapCountByReviewId,
  getCurrentScrapStatusByReviewIdAndUserId,
  postReviewScrapByReviewId,
  updateReviewScrapCount,
  getReviewOrderByRecent, 
};
