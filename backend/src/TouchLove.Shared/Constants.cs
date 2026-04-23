namespace TouchLove.Shared;

public static class Constants
{
    public static class Roles
    {
        public const string Admin = "Admin";
        public const string User = "User";
    }

    public static class Auth
    {
        public const int AccessTokenMinutes = 15;
        public const int RefreshTokenDaysDefault = 7;
        public const int RefreshTokenDaysRememberMe = 30;
        public const int EmailVerificationHours = 24;
        public const int PasswordResetMinutes = 15;
        public const int MaxLoginAttempts = 5;
        public const int LockoutMinutes = 15;
        public const int ForgotPasswordRateLimit = 3; // per hour per email
        public const int ResendVerificationRateLimit = 3; // per day
    }

    public static class Album
    {
        public const int MaxMemoriesPerCouple = 200;
        public const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB
        public const int DeleteAfterDays = 7;
    }

    public static class Message
    {
        public const int MaxBookmarksPerCouple = 20;
        public const int TemplateExclusionDays = 30; // avoid repeating templates
    }

    public static class Cache
    {
        public const int CouplePageMinutes = 5;
        public const int TodayMessageMinutes = 60;
    }

    public static class InviteCode
    {
        public const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0,O,I,1
        public const int Length = 6;
        public const int ExpirationHours = 24;
    }

    public static class UnpairRequest
    {
        public const int ExpirationHours = 48;
    }
}
