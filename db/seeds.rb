User.create!(name:  "Deepak Birdi",
 email: "deepakbirdi25@gmail.com",
 password:              "foobar",
 password_confirmation: "foobar",
 admin: true,
 activated: true,
 activated_at: 1.month.ago)

User.create!(name:  "dbzguy56",
email: "dbzguy56@gmail.com",
password:              "foobar",
password_confirmation: "foobar",
admin: false,
activated: true,
activated_at: 6.day.ago)

Post.create!(user_id: 1,
  title: "Mario Odyssey Trailer",
  content: "https://www.youtube.com/watch?v=5kcdRBHM7kM",
  created_at: 5.day.ago)

Post.create!(user_id: 2,
  title: "Check the Rhime by A Tribe Called Quest",
  content: "https://www.youtube.com/watch?v=Q6TLWqn82J4",
  created_at: 1.day.ago)

Post.create!(user_id: 1,
  title: "very happy employee",
  content: "https://i.imgur.com/M0PLQrI.gifv",
  created_at: 3.day.ago)

Post.create!(user_id: 1,
  title: "doggo",
  content: "https://i.imgur.com/W5LUEkp.gifv",
  created_at: Time.zone.now)
