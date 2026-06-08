using System;
using System.Reflection;
using PayOS;
using PayOS.Models.Webhooks;

class Program
{
    static void Main()
    {
        Console.WriteLine("--- WebhookData ---");
        foreach(var p in typeof(WebhookData).GetProperties())
            Console.WriteLine(p.PropertyType.Name + " " + p.Name);
            
        Console.WriteLine("--- Webhook ---");
        foreach(var p in typeof(Webhook).GetProperties())
            Console.WriteLine(p.PropertyType.Name + " " + p.Name);
    }
}
