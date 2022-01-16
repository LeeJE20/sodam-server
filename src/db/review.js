const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

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


module.exports = {
  getReviewByShopIdOrderByLike, 
  getReviewByShopIdOrderByScrap, 
  getReviewByShopIdOrderByRecent, 
  getLikeCountByReviewId,
  getCurrentLikeStatusByReviewIdAndUserId,
  postReviewLikeByReviewId,
  updateReviewLikeCount,
  getScrapCountByReviewId,
  getCurrentScrapStatusByReviewIdAndUserId,
  postReviewScrapByReviewId,
  updateReviewScrapCount,
};
